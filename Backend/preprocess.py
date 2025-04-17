import os
import joblib
import numpy as np
import pandas as pd
from google.oauth2 import service_account
from googleapiclient.discovery import build
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split

# ✅ Ensure model directory exists
os.makedirs("model", exist_ok=True)

# ✅ Google Sheets credentials
SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
SERVICE_ACCOUNT_FILE = r"D:\coding\mini project new\backend\credentials_service.json"
SPREADSHEET_ID = "1kHP7cAB_-Rnb7WH3uGH4CUkkmTs6f8Ub1X6nO91VXr0"
RANGE_NAME = "A1:Z"

# ✅ Authenticate and fetch data from Google Sheets
def fetch_data_from_google_sheets():
    try:
        credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        service = build("sheets", "v4", credentials=credentials)
        
        sheet = service.spreadsheets()
        result = sheet.values().get(spreadsheetId=SPREADSHEET_ID, range=RANGE_NAME).execute()
        values = result.get("values", [])
        
        if not values:
            raise ValueError("❌ No data found in the spreadsheet.")
        
        # Convert to DataFrame
        df = pd.DataFrame(values[1:], columns=values[0])
        return df
    except Exception as e:
        print(f"❌ Error fetching data: {str(e)}")
        raise e

# ✅ Preprocess data for Churn Prediction
def preprocess_churn_data(df):
    # Handle missing values for numeric columns (replace with mean or median)
    numeric_cols = ["TotalCharges", "tenure", "MonthlyCharges"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        df[col].fillna(df[col].mean(), inplace=True)  # Fill missing with column mean

    # Drop customerID if exists
    df.drop(columns=["customerID"], axis=1, errors="ignore", inplace=True)

    # Convert Churn column to binary
    df["Churn"] = df["Churn"].map({"Yes": 1, "No": 0})

    # Select features for churn prediction
    selected_features_churn = ["tenure", "MonthlyCharges", "TotalCharges", "Contract", "InternetService"]
    X_churn = df[selected_features_churn].copy()

    # One-hot encode categorical features
    categorical_features_churn = ["Contract", "InternetService"]
    encoder_churn = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
    encoded_churn = encoder_churn.fit_transform(X_churn[categorical_features_churn])
    encoded_churn_df = pd.DataFrame(encoded_churn, columns=encoder_churn.get_feature_names_out(categorical_features_churn))

    # Merge encoded features with numeric features
    X_churn.drop(columns=categorical_features_churn, inplace=True)
    X_churn_final = pd.concat([X_churn, encoded_churn_df], axis=1)

    # Scale features
    scaler_churn = StandardScaler()
    X_churn_scaled = scaler_churn.fit_transform(X_churn_final)

    # Prepare target variable
    y_churn = df["Churn"].astype(int)

    # Train-test split for churn prediction
    X_train_churn, X_test_churn, y_train_churn, y_test_churn = train_test_split(X_churn_scaled, y_churn, test_size=0.2, random_state=42)

    # Save preprocessed data
    np.save("model/X_train_churn.npy", X_train_churn)
    np.save("model/X_test_churn.npy", X_test_churn)
    np.save("model/y_train_churn.npy", y_train_churn)
    np.save("model/y_test_churn.npy", y_test_churn)

    # Save encoder and scaler
    joblib.dump(scaler_churn, "model/scaler_churn.pkl")
    joblib.dump(encoder_churn, "model/encoder_churn.pkl")

    return X_train_churn, X_test_churn, y_train_churn, y_test_churn

# ✅ Preprocess data for Visualization (e.g., feature engineering for visualization)
def preprocess_visualization_data(df):
    selected_features_vis = [
        "tenure", "MonthlyCharges", "TotalCharges", "gender",
        "StreamingTV", "StreamingMovies", "PaymentMethod", "InternetService", "Contract"
    ]
    
    X_vis = df[selected_features_vis].copy()

    # One-hot encode categorical variables
    categorical_features_vis = ["gender", "StreamingTV", "StreamingMovies", "PaymentMethod", "InternetService", "Contract"]
    encoder_vis = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
    encoded_cats = encoder_vis.fit_transform(X_vis[categorical_features_vis])
    encoded_df = pd.DataFrame(encoded_cats, columns=encoder_vis.get_feature_names_out(categorical_features_vis))

    # Merge encoded features with numeric features
    X_vis.drop(columns=categorical_features_vis, inplace=True)
    X_vis_final = pd.concat([X_vis, encoded_df], axis=1)

    # Scale features
    scaler_vis = StandardScaler()
    X_vis_scaled = scaler_vis.fit_transform(X_vis_final)

    # Train-test split for visualization data
    X_train_vis, X_test_vis = train_test_split(X_vis_scaled, test_size=0.2, random_state=42)

    # Save preprocessed data
    np.save("model/X_train_vis.npy", X_train_vis)
    np.save("model/X_test_vis.npy", X_test_vis)

    # Save encoder and scaler
    joblib.dump(scaler_vis, "model/scaler_vis.pkl")
    joblib.dump(encoder_vis, "model/encoder_vis.pkl")

    return X_train_vis, X_test_vis

# Main preprocessing function
def main():
    try:
        # Fetch data
        df = fetch_data_from_google_sheets()

        # Preprocess churn data
        preprocess_churn_data(df)

        # Preprocess visualization data
        preprocess_visualization_data(df)

        print("✅ Preprocessing completed successfully!")
    except Exception as e:
        print(f"❌ Error during preprocessing: {str(e)}")
        raise e

if __name__ == "__main__":
    main()
