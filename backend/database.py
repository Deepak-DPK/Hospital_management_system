import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection

load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_DETAILS")
if not MONGO_DETAILS:
    raise RuntimeError("MONGO_DETAILS environment variable is not set")

client = AsyncIOMotorClient(MONGO_DETAILS)
db = client["hms_db"]


async def get_users_collection() -> AsyncIOMotorCollection:
    return db["users"]


async def get_appointments_collection() -> AsyncIOMotorCollection:
    return db["appointments"]


async def get_records_collection() -> AsyncIOMotorCollection:
    return db["medical_records"]


async def get_prescriptions_collection() -> AsyncIOMotorCollection:
    return db["prescriptions"]


async def get_beds_collection() -> AsyncIOMotorCollection:
    return db["beds"]


async def get_bills_collection() -> AsyncIOMotorCollection:
    return db["bills"]
