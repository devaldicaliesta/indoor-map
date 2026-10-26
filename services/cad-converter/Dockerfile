FROM python:3.12-slim
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY notices.py /tmp/notices.py
RUN python /tmp/notices.py > /srv/THIRD-PARTY-NOTICES.txt && rm /tmp/notices.py
RUN useradd --system --no-create-home converter
USER converter
ENV PORT=8090
EXPOSE 8090
HEALTHCHECK CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8090/health')"
CMD ["python", "-m", "app.server"]
