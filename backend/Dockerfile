FROM python:3.13-slim

ENV INSTALL_EXTRAS=.
ENV PORT=8000
ENV RELOAD=
ENV LOG_LEVEL=info

EXPOSE ${PORT}

COPY setup.py .
RUN pip install --no-cache-dir ${INSTALL_EXTRAS}

COPY . .

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT} ${RELOAD} --log-level ${LOG_LEVEL} --no-access-log
