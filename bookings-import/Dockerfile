FROM python:3.7-stretch

# Create non-privileged user
RUN groupadd -r -g 666 import && useradd -r -u 666 -g import import

COPY requirements.txt /tmp/
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

COPY ./app /app

# Run as non-privileged user
USER import

CMD [ "/app/import.py", "--synth", "--backend_service", "http://escape-backend:8080" ]
