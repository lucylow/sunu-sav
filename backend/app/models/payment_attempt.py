# backend/app/models/payment_attempt.py
from sqlalchemy import Column, String, Text, Integer, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class PaymentAttempt(Base):
    __tablename__ = "payment_attempts"
    
    id = Column(String, primary_key=True)  # client idempotency key or uuid
    invoice = Column(Text, nullable=False)
    status = Column(String, nullable=False)  # pending | success | failed
    preimage = Column(String, nullable=True)
    fee_sat = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    def to_dict(self):
        return {
            "id": self.id,
            "invoice": self.invoice,
            "status": self.status,
            "preimage": self.preimage,
            "fee_sat": self.fee_sat,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
