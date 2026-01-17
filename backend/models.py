from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Text, Float, Time, DateTime
from datetime import datetime

class Base(DeclarativeBase):
    pass

class Location(Base):
    __tablename__ = "locations"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)

    days: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_time: Mapped[object | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[object | None] = mapped_column(Time, nullable=True)

    happy_hour: Mapped[str | None] = mapped_column(Text, nullable=True)
    # description: Mapped[str | None] = mapped_column(Text, nullable=True)

    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
