# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import click
import os

from app import create_app, db
from app.models import Score
from datetime import datetime, timezone

config_name = os.getenv('FLASK_CONFIG')
app = create_app(config_name)

# TODO: This is a temporary fix! It can be removed once all high scores are
# fixed in the DB
@app.cli.command()
@click.option('--dryrun', is_flag=True)
def fix_highscore_dates(dryrun):
    print("Going through all score entries and dropping their dates")
    scores = db.session.query(Score).all()
    changed = 0
    for score in scores:
        old = score.time
        scoretime = datetime.utcfromtimestamp(score.time)
        time = datetime(year=1970,
                        month=1,
                        day=1,
                        hour=scoretime.hour,
                        minute=scoretime.minute,
                        second=scoretime.second,
                        tzinfo=timezone.utc)
        score.time = int(time.timestamp())
        if score.time != old:
            changed += 1

    if dryrun:
        print("Done: {} would have been affected".format(changed))
    else:
        db.session.commit()
        print("Done: {} entries affected".format(changed))

if __name__ == '__main__':
    app.run()
