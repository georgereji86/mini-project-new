import os
import joblib
import lime
import numpy as np
import pandas as pd
import shap
import tensorflow as tf
from flask import Flask, jsonify, request
from flask_cors import CORS
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from lime.lime_tabular import LimeTabularExplainer

# ✅ Load Google Sheets Credentials
SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
SERVICE_ACCOUNT_FILE = r"D:\coding\mini project new\backend\credentials_service.json"
SPREADSHEET_ID = "1kHP7cAB_-Rnb7WH3uGH4CUkkmTs6f8Ub1X6nO91VXr0"
RANGE_NAME = "A1:Z"

# ✅ Authenticate with Google Sheets API
creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
service = build("sheets", "v4", credentials=creds)

# ✅ Load ML Model, Scaler, and Encoder
scaler = joblib.load(r"D:\coding\mini project new\backend\model\scaler_churn.pkl")
encoder = joblib.load(r"D:\coding\mini project new\backend\model\encoder_churn.pkl")  # Load the encoder
model = tf.keras.models.load_model(r"D:\coding\mini project new\backend\model\best_churn_model.keras")

# Debugging: Check if encoder and scaler are loaded properly
try:
    print("✅ Encoder loaded successfully:", encoder)
    print("✅ Scaler loaded successfully:", scaler)
except Exception as e:
    print("❌ Error loading encoder or scaler:", str(e))

# ✅ Initialize Flask App
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# ✅ Fetch Google Sheets Data
def fetch_sheet_data():
    try:
        response = service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID, range=RANGE_NAME
        ).execute()
        data = response.get("values", [])

        if not data:
            print("⚠️ Google Sheets API returned empty data!")
        return data
    except Exception as e:
        print(f"❌ Error fetching Google Sheets data: {e}")
        return []
    
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        if not data:
            raise ValueError("No data received")

        # Extract input values
        tenure = float(data.get("tenure", 0))
        monthly_charges = float(data.get("monthlyCharges", 0))
        total_charges = data.get("totalCharges", "0")
        contract = data.get("contract", "Month-to-month")
        internet_service = data.get("internetService", "DSL")

        # Convert TotalCharges to float safely
        try:
            total_charges = float(total_charges)
        except ValueError:
            total_charges = 0.0

        # Prepare data as DataFrame
        input_data = pd.DataFrame([[tenure, monthly_charges, total_charges, contract, internet_service]],
                                  columns=["tenure", "MonthlyCharges", "TotalCharges", "Contract", "InternetService"])

        # Encode categorical data
        categorical_encoded = encoder.transform(input_data[["Contract", "InternetService"]])
        categorical_df = pd.DataFrame(categorical_encoded, columns=encoder.get_feature_names_out())

        # Prepare numeric data
        numeric_df = input_data[["tenure", "MonthlyCharges", "TotalCharges"]]

        # Combine numeric and categorical data
        processed_data = pd.concat([numeric_df, categorical_df], axis=1)

        # Ensure column order matches the model training
        expected_features = ["tenure", "MonthlyCharges", "TotalCharges"] + list(encoder.get_feature_names_out())
        processed_data = processed_data[expected_features]

        # Scale input data
        X_scaled = scaler.transform(processed_data)

        # Reshape for Conv1D model (3D format)
        X_scaled = X_scaled.reshape(1, X_scaled.shape[1], 1)

        # Make prediction
        churn_probability = model.predict(X_scaled)[0][0]
        churn_result = "Yes" if churn_probability >= 0.5 else "No"

        # Define Personalized Offers based on more granular data
        offer = ""

        # Add more personalized retention strategies
        if churn_result == "Yes":
            if tenure < 3:
                offer = "New customers get 3 months of premium service at the price of a basic plan. Free router upgrade included!"
            elif tenure < 6:
                offer = "We value you! Enjoy a 10% discount on your next 3 months' subscription."
            elif monthly_charges > 120:
                offer = "Spend less and get more! Switch to an annual plan and save $20/month."
            elif contract == "Month-to-month":
                offer = "Switch to a 12-month contract and get 20% off your monthly charges."
            elif internet_service == "DSL":
                offer = "Upgrade to fiber and enjoy faster speeds with a 15% discount."
            elif total_charges > 500:
                offer = "Loyal customers get a 10% discount as a token of appreciation. Tell us what you think and get additional discounts based on feedback."
            elif total_charges > 1000:
                offer = "As one of our top customers, enjoy a special upgrade to our premium plan."
            
        else:
            offer = "Thank you for staying with us! Enjoy a 5% discount on your next month’s subscription."
            if tenure > 12:
                offer += " As a loyal customer, we are giving you a VIP discount on your next bill."
            if internet_service == "DSL":
                offer += " Upgrade to fiber for faster speeds and more data."
            if monthly_charges > 120:
                offer += " Unlock exclusive offers on premium plans!"

        return jsonify({
            "churn_probability": float(churn_probability),
            "churn": churn_result,
            "personalized_offer": offer,
            "comparison_data": {
                "tenure": tenure,
                "monthlyCharges": monthly_charges,
                "totalCharges": total_charges,
                "contract": contract,
                "internetService": internet_service
            }
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


    # ✅ Gender vs. Monthly Charges
@app.route("/gender-monthly-charges", methods=["GET"])
def gender_vs_monthly_charges():
    try:
        sheet_data = fetch_sheet_data()
                
        if not sheet_data:
            return jsonify({"error": "Google Sheets returned no data."}), 500

        headers = sheet_data[0]
        gender_index = headers.index("gender") if "gender" in headers else -1
        monthly_charges_index = headers.index("MonthlyCharges") if "MonthlyCharges" in headers else -1

        if gender_index == -1 or monthly_charges_index == -1:
            return jsonify({"error": "Missing required columns"}), 500

        gender_data = {}

        for row in sheet_data[1:]:
            if len(row) > max(gender_index, monthly_charges_index):
                try:
                    gender = row[gender_index]
                    monthly_charges = float(row[monthly_charges_index])
                    if gender in gender_data:
                        gender_data[gender].append(monthly_charges)
                    else:
                        gender_data[gender] = [monthly_charges]
                except ValueError:
                    continue

        result = [
            {"gender": g, "avgMonthlyCharge": sum(charges) / len(charges)}
            for g, charges in gender_data.items()
        ]

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Tenure vs. Monthly Charges
@app.route("/tenure-monthly-charges", methods=["GET"])
def tenure_vs_monthly_charges():
    try:
        sheet_data = fetch_sheet_data()
        headers = sheet_data[0] if sheet_data else []
        
        tenure_index = headers.index("tenure") if "tenure" in headers else -1
        monthly_charges_index = headers.index("MonthlyCharges") if "MonthlyCharges" in headers else -1

        if tenure_index == -1 or monthly_charges_index == -1:
            return jsonify({"error": "Required columns not found"}), 500

        tenure_values, monthly_charges_values = [], []

        for row in sheet_data[1:]:
            if len(row) > max(tenure_index, monthly_charges_index):
                try:
                    tenure_values.append(float(row[tenure_index]))
                    monthly_charges_values.append(float(row[monthly_charges_index]))
                except ValueError:
                    continue

        result = [{"tenure": tenure_values[i], "monthly_charges": monthly_charges_values[i]} for i in range(len(tenure_values))]

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Churn Distribution
@app.route("/churn-distribution", methods=["GET"])
def churn_distribution():
    try:
        sheet_data = fetch_sheet_data()
        headers = sheet_data[0] if sheet_data else []
        
        churn_index = headers.index("Churn") if "Churn" in headers else -1

        if churn_index == -1:
            return jsonify({"error": "Required columns not found"}), 500

        churn_counts = {"Yes": 0, "No": 0}

        for row in sheet_data[1:]:
            if len(row) > churn_index:
                churn_value = row[churn_index]
                if churn_value in churn_counts:
                    churn_counts[churn_value] += 1

        result = [
            {"churn": "Yes", "count": churn_counts["Yes"]},
            {"churn": "No", "count": churn_counts["No"]}
        ]

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Churn vs Gender vs Monthly Charges
@app.route("/churn-gender-monthly-charges", methods=["GET"])
def churn_gender_monthly_charges():
    try:
        sheet_data = fetch_sheet_data()
        if not sheet_data:
            return jsonify({"error": "Google Sheets returned no data."}), 500

        headers = sheet_data[0]
        churn_index = headers.index("Churn") if "Churn" in headers else -1
        gender_index = headers.index("gender") if "gender" in headers else -1
        monthly_charges_index = headers.index("MonthlyCharges") if "MonthlyCharges" in headers else -1

        if churn_index == -1 or gender_index == -1 or monthly_charges_index == -1:
            return jsonify({"error": "Missing required columns"}), 500

        data = {}

        for row in sheet_data[1:]:
            if len(row) > max(churn_index, gender_index, monthly_charges_index):
                try:
                    churn = row[churn_index]
                    gender = row[gender_index]
                    monthly_charges = float(row[monthly_charges_index])

                    if churn not in data:
                        data[churn] = {}

                    if gender not in data[churn]:
                        data[churn][gender] = []

                    data[churn][gender].append(monthly_charges)

                except ValueError:
                    continue

        result = []
        for churn, gender_data in data.items():
            for gender, charges in gender_data.items():
                result.append({
                    "churn": churn,
                    "gender": gender,
                    "avgMonthlyCharge": sum(charges) / len(charges)
                })

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Churn vs Tenure
@app.route("/churn-tenure", methods=["GET"])
def churn_tenure():
    try:
        sheet_data = fetch_sheet_data()
        if not sheet_data:
            return jsonify({"error": "Google Sheets returned no data."}), 500

        headers = sheet_data[0]
        churn_index = headers.index("Churn") if "Churn" in headers else -1
        tenure_index = headers.index("tenure") if "tenure" in headers else -1

        if churn_index == -1 or tenure_index == -1:
            return jsonify({"error": "Missing required columns"}), 500

        data = {"Yes": [], "No": []}

        for row in sheet_data[1:]:
            if len(row) > max(churn_index, tenure_index):
                try:
                    churn = row[churn_index]
                    tenure = float(row[tenure_index])
                    if churn in data:
                        data[churn].append(tenure)
                except ValueError:
                    continue

        result = []
        for churn, tenure_values in data.items():
            result.append({
                "churn": churn,
                "tenure_values": tenure_values
            })

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Gender vs Payment Method vs Churn
@app.route("/gender-payment-method-churn", methods=["GET"])
def gender_payment_method_churn():
    try:
        sheet_data = fetch_sheet_data()
        if not sheet_data:
            return jsonify({"error": "Google Sheets returned no data."}), 500

        headers = sheet_data[0]
        gender_index = headers.index("gender") if "gender" in headers else -1
        payment_method_index = headers.index("PaymentMethod") if "PaymentMethod" in headers else -1
        churn_index = headers.index("Churn") if "Churn" in headers else -1

        if gender_index == -1 or payment_method_index == -1 or churn_index == -1:
            return jsonify({"error": "Missing required columns"}), 500

        data = {}

        for row in sheet_data[1:]:
            if len(row) > max(gender_index, payment_method_index, churn_index):
                try:
                    gender = row[gender_index]
                    payment_method = row[payment_method_index]
                    churn = row[churn_index]

                    if gender not in data:
                        data[gender] = {}

                    if payment_method not in data[gender]:
                        data[gender][payment_method] = {"Yes": 0, "No": 0}

                    data[gender][payment_method][churn] += 1
                except ValueError:
                    continue

        result = []
        for gender, payment_method_data in data.items():
            for payment_method, churn_data in payment_method_data.items():
                result.append({
                    "gender": gender,
                    "payment_method": payment_method,
                    "churn_yes": churn_data["Yes"],
                    "churn_no": churn_data["No"]
                })

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Gender vs Streaming Movies
@app.route("/gender-streaming-movies", methods=["GET"])
def gender_streaming_movies():
    try:
        sheet_data = fetch_sheet_data()
        if not sheet_data:
            return jsonify({"error": "Google Sheets returned no data."}), 500

        headers = sheet_data[0]
        gender_index = headers.index("gender") if "gender" in headers else -1
        streaming_movies_index = headers.index("StreamingMovies") if "StreamingMovies" in headers else -1

        if gender_index == -1 or streaming_movies_index == -1:
            return jsonify({"error": "Missing required columns"}), 500

        data = {}

        for row in sheet_data[1:]:
            if len(row) > max(gender_index, streaming_movies_index):
                try:
                    gender = row[gender_index]
                    streaming_movies = row[streaming_movies_index]

                    if gender not in data:
                        data[gender] = {}

                    if streaming_movies not in data[gender]:
                        data[gender][streaming_movies] = 0

                    data[gender][streaming_movies] += 1
                except ValueError:
                    continue

        result = []
        for gender, streaming_data in data.items():
            for streaming_movies, count in streaming_data.items():
                result.append({
                    "gender": gender,
                    "streaming_movies": streaming_movies,
                    "count": count
                })

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Run Flask Server
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)