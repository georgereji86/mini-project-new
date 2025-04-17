# 📊 Telecom Churn Prediction & Visualization

This project predicts customer churn using machine learning and visualizes user patterns. Data is fetched in real time from a **Google Sheet**, preprocessed, and prepared for both **prediction** and **insightful visualizations**.

---

## 🚀 Features

- 🔗 Real-time data fetch from Google Sheets
- ⚙️ Churn prediction based on customer usage and contract details
- 📈 Visualization-ready processed data
- 🧠 Machine learning preprocessing (scaling + encoding)
- 🔐 Trained models saved for deployment

churn-prediction-project/
│
├── backend/
│   ├── app.py                        # Flask API server
│   ├── predict.py                    # Prediction logic (loads model and predicts)
│   ├── preprocess.py                 # Google Sheets + preprocessing logic
│   ├── requirements.txt              # Backend dependencies
│   ├── credentials_service.json      # Google Sheets API credentials
│   └── model/
│       ├── churn_model.pkl           # Trained model (e.g., RandomForest or Conv1D)
│       ├── scaler_churn.pkl          # Scaler for churn features
│       ├── encoder_churn.pkl         # Encoder for churn features
│       ├── scaler_vis.pkl            # Scaler for visualization features
│       ├── encoder_vis.pkl           # Encoder for visualization features
│       ├── X_train_churn.npy
│       ├── X_test_churn.npy
│       ├── y_train_churn.npy
│       ├── y_test_churn.npy
│       ├── X_train_vis.npy
│       ├── X_test_vis.npy
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js                    # Main app entry point
│   │   ├── index.js                  # React root
│   │   ├── components/
│   │   │   ├── PredictForm.js        # Form to input user data and predict churn
│   │   │   ├── Dashboard.js          # Overview of user activity or summary
│   │   │   ├── Login.js              # Login component (simple auth/UI)
│   │   │   └── Visualization.js      # Visualization with chart around it
│   │   └── charts/
│   │       └── ChurnChart.js         # Component for rendering churn-related charts
│   ├── package.json                  # Frontend dependencies
│   └── .env                          # Environment variables (API URL, etc.)
│
├── README.md                         # Step-by-step instructions (see below)
└── .gitignore


THEN RUN BOTH BACKEND(FLASK) AND FRONTEND(NODE.JS)




