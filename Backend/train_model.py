import os
import numpy as np
import tensorflow as tf
from sklearn.model_selection import KFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from imblearn.over_sampling import SMOTE
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint

# ✅ Ensure model directory exists
os.makedirs("model", exist_ok=True)

# ✅ Load preprocessed data
X_train_churn = np.load("model/X_train_churn.npy")
y_train_churn = np.load("model/y_train_churn.npy").astype(int)
X_train_vis = np.load("model/X_train_vis.npy")

# ✅ Balance Data Using SMOTE for Churn Prediction
smote = SMOTE(sampling_strategy=0.5, random_state=42)
X_train_churn, y_train_churn = smote.fit_resample(X_train_churn.reshape(X_train_churn.shape[0], -1), y_train_churn)
X_train_churn = X_train_churn.reshape(-1, X_train_churn.shape[1], 1)  # Reshaping for Conv1D input
X_train_vis = X_train_vis.reshape(-1, X_train_vis.shape[1], 1)  # Reshaping for Conv1D input

# ✅ Enable Mixed Precision (Faster Training on GPU)
tf.keras.mixed_precision.set_global_policy("mixed_float16")

# ✅ Define Residual Block
def residual_block(x, filters=64):
    shortcut = x
    x = tf.keras.layers.Conv1D(filters, 3, padding="same", activation=None)(x)
    x = tf.keras.layers.LayerNormalization()(x)
    x = tf.keras.layers.LeakyReLU()(x)
    x = tf.keras.layers.Conv1D(filters, 3, padding="same", activation=None)(x)
    x = tf.keras.layers.LayerNormalization()(x)
    x = tf.keras.layers.LeakyReLU()(x)
    x = tf.keras.layers.Add()([shortcut, x])
    return x

# ✅ Define Squeeze-and-Excitation (SE) Block
def se_block(x, ratio=16):
    channels = x.shape[-1]
    se = tf.keras.layers.GlobalAveragePooling1D()(x)
    se = tf.keras.layers.Dense(channels // ratio, activation="relu")(se)
    se = tf.keras.layers.Dense(channels, activation="sigmoid")(se)
    se = tf.keras.layers.Reshape((1, channels))(se)
    x = tf.keras.layers.Multiply()([x, se])
    return x

# ✅ Define Spatial Attention Module
def spatial_attention(x):
    attn = tf.keras.layers.Conv1D(1, kernel_size=7, padding="same", activation="sigmoid")(x)
    return tf.keras.layers.Multiply()([x, attn])

# ✅ Define CNN Model for Churn Prediction and Visualization
def create_model(input_shape):
    inputs = tf.keras.Input(shape=input_shape)
    
    x = tf.keras.layers.Conv1D(64, 3, padding="same", activation=None)(inputs)
    x = tf.keras.layers.LayerNormalization()(x)
    x = tf.keras.layers.LeakyReLU()(x)
    
    x = residual_block(x)
    x = se_block(x)
    x = spatial_attention(x)
    
    x = tf.keras.layers.GlobalAveragePooling1D()(x)
    x = tf.keras.layers.Dense(128, activation="relu")(x)
    x = tf.keras.layers.LayerNormalization()(x)
    x = tf.keras.layers.Dropout(0.2)(x)
    
    x = tf.keras.layers.Dense(64, activation="relu")(x)
    x = tf.keras.layers.LayerNormalization()(x)
    x = tf.keras.layers.Dense(32, activation="relu")(x)
    
    outputs = tf.keras.layers.Dense(1, activation="sigmoid", dtype="float32")(x)
    return tf.keras.Model(inputs=inputs, outputs=outputs)

# ✅ Training Callbacks
early_stopping = EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True)
lr_scheduler = ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=5, verbose=1)
checkpoint = ModelCheckpoint("model/best_churn_model.keras", save_best_only=True, monitor="val_loss")

# ✅ Train Churn Prediction Model with K-Fold Cross-Validation
kf = KFold(n_splits=10, shuffle=True, random_state=42)
churn_metrics = []

for fold, (train_idx, val_idx) in enumerate(kf.split(X_train_churn)):
    print(f"\n🔄 Training Fold {fold + 1}...")
    tf.keras.backend.clear_session()
    
    X_train, X_val = X_train_churn[train_idx], X_train_churn[val_idx]
    y_train, y_val = y_train_churn[train_idx], y_train_churn[val_idx]
    
    model = create_model(input_shape=(X_train.shape[1], 1))
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.0003), loss="binary_crossentropy", metrics=["accuracy"])
    
    train_dataset = tf.data.Dataset.from_tensor_slices((X_train, y_train)).batch(128).shuffle(1000).prefetch(tf.data.AUTOTUNE)
    val_dataset = tf.data.Dataset.from_tensor_slices((X_val, y_val)).batch(128).prefetch(tf.data.AUTOTUNE)
    
    model.fit(train_dataset, validation_data=val_dataset, epochs=50, verbose=1, callbacks=[early_stopping, lr_scheduler, checkpoint])
    
    y_pred = (model.predict(X_val) > 0.5).astype("int32")
    metrics = {
        "accuracy": accuracy_score(y_val, y_pred),
        "precision": precision_score(y_val, y_pred),
        "recall": recall_score(y_val, y_pred),
        "f1": f1_score(y_val, y_pred)
    }
    churn_metrics.append(metrics)

# ✅ Save Final Churn Prediction Model
model.save("model/final_model.keras")

# ✅ Train Visualization Model (Unsupervised Learning)
tf.keras.backend.clear_session()

model_vis = create_model(input_shape=(X_train_vis.shape[1], 1))
model_vis.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.0003), loss="mse", metrics=["mae"])

vis_dataset = tf.data.Dataset.from_tensor_slices((X_train_vis, X_train_vis)).batch(256).shuffle(1000).prefetch(tf.data.AUTOTUNE)
model_vis.fit(vis_dataset, epochs=50, verbose=1, callbacks=[early_stopping, lr_scheduler])

# ✅ Save Visualization Model
model_vis.save("model/visualization_model.keras")

# ✅ Print Average Metrics
avg_churn_metrics = {key: np.mean([m[key] for m in churn_metrics]) for key in churn_metrics[0]}
print("\n🔍 Average Churn Model Metrics:")
print(f"✅ Accuracy: {avg_churn_metrics['accuracy']:.4f}, Precision: {avg_churn_metrics['precision']:.4f}, Recall: {avg_churn_metrics['recall']:.4f}, F1-score: {avg_churn_metrics['f1']:.4f}")

print("✅ Training for both Churn Prediction & Visualization models completed successfully!")
