FROM python:3.7-stretch

EXPOSE 8080

# Create non-privileged user
RUN groupadd -r -g 666 backend && useradd -r -u 666 -g backend backend

# Install Supervisord
RUN apt-get update && apt-get install -y supervisor postgresql-client postgresql-server-dev-all \
        && rm -rf /var/lib/apt/lists/*

# Custom Supervisord config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

COPY requirements.txt /tmp/
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

COPY ./app /app

# Run as non-privileged user
USER backend

CMD [ "/app/start.sh" ]
