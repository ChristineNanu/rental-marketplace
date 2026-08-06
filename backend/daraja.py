import requests
import base64
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY")
CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET")
SHORTCODE = os.getenv("MPESA_SHORTCODE", "174379")
PASSKEY = os.getenv("MPESA_PASSKEY")
CALLBACK_URL = os.getenv("MPESA_CALLBACK_URL")
ENV = os.getenv("MPESA_ENV", "sandbox")

BASE_URL = "https://sandbox.safaricom.co.ke" if ENV == "sandbox" else "https://api.safaricom.co.ke"


def get_access_token() -> str:
    url = f"{BASE_URL}/oauth/v1/generate?grant_type=client_credentials"
    credentials = base64.b64encode(f"{CONSUMER_KEY}:{CONSUMER_SECRET}".encode()).decode()
    response = requests.get(url, headers={"Authorization": f"Basic {credentials}"})
    response.raise_for_status()
    return response.json()["access_token"]


def generate_password() -> tuple:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    raw = f"{SHORTCODE}{PASSKEY}{timestamp}"
    password = base64.b64encode(raw.encode()).decode()
    return password, timestamp


def stk_push(phone: str, amount: int, account_ref: str, description: str) -> dict:
    token = get_access_token()
    password, timestamp = generate_password()

    phone = phone.strip().replace("+", "").replace(" ", "")
    if phone.startswith("0"):
        phone = "254" + phone[1:]
    if not phone.startswith("254"):
        phone = "254" + phone

    payload = {
        "BusinessShortCode": SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phone,
        "PartyB": SHORTCODE,
        "PhoneNumber": phone,
        "CallBackURL": CALLBACK_URL,
        "AccountReference": account_ref,
        "TransactionDesc": description
    }

    url = f"{BASE_URL}/mpesa/stkpush/v1/processrequest"
    response = requests.post(
        url,
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    return response.json()


def query_stk_status(checkout_request_id: str) -> dict:
    token = get_access_token()
    password, timestamp = generate_password()

    payload = {
        "BusinessShortCode": SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "CheckoutRequestID": checkout_request_id
    }

    url = f"{BASE_URL}/mpesa/stkpushquery/v1/query"
    response = requests.post(
        url,
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    return response.json()


def b2c_payout(phone: str, amount: int, occasion: str, remarks: str) -> dict:
    """B2C - Business pays money TO a customer phone number (refunds/payouts)."""
    token = get_access_token()

    phone = phone.strip().replace("+", "").replace(" ", "")
    if phone.startswith("0"):
        phone = "254" + phone[1:]
    if not phone.startswith("254"):
        phone = "254" + phone

    b2c_callback = CALLBACK_URL.replace("/pay/callback", "/pay/b2c-callback")

    payload = {
        "InitiatorName": "testapi",  # Sandbox initiator
        "SecurityCredential": os.getenv("MPESA_SECURITY_CREDENTIAL", "Safaricom999!"),
        "CommandID": "BusinessPayment",
        "Amount": amount,
        "PartyA": SHORTCODE,
        "PartyB": phone,
        "Remarks": remarks,
        "QueueTimeOutURL": b2c_callback,
        "ResultURL": b2c_callback,
        "Occasion": occasion
    }

    url = f"{BASE_URL}/mpesa/b2c/v3/paymentrequest"
    response = requests.post(
        url,
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    return response.json()
