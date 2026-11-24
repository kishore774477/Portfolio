from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    subject: str = Field(min_length=1, max_length=300)
    message: str = Field(min_length=1, max_length=5000)


class ContactOut(BaseModel):
    ok: bool
    id: int
    email_sent: bool


class ContactRecord(BaseModel):
    id: int
    name: str
    email: str
    subject: str
    message: str
    email_sent: bool
    created_at: datetime

    class Config:
        from_attributes = True
