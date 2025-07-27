FROM python:3.13-slim

ENV INSTALL_EXTRAS=.[dev]
ENV PORT=8000
ENV RELOAD=--reload
ENV LOG_LEVEL=info

EXPOSE ${PORT}

RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY setup.py .
RUN pip install --no-cache-dir ${INSTALL_EXTRAS}

COPY . .

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT} ${RELOAD} --log-level ${LOG_LEVEL}
