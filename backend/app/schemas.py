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


class ArticleCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    tag: str = Field(min_length=1, max_length=120)
    read_time: str = Field(min_length=1, max_length=60)
    excerpt: str = Field(min_length=1, max_length=600)
    content: str = Field(min_length=1, max_length=20000)
    stack: list[str] = Field(default_factory=list)


class ArticleOut(BaseModel):
    id: int
    title: str
    tag: str
    read_time: str
    excerpt: str
    content: str
    stack: list[str]
    created_at: datetime

    class Config:
        from_attributes = True
