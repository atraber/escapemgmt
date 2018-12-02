FROM tiangolo/uwsgi-nginx-flask:python3.7

# Install required python packages.
COPY requirements.txt /tmp/
RUN pip install -r /tmp/requirements.txt

COPY ./app /app
