# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from quart import abort, Blueprint, request, Response, jsonify

from app import db
from models import Stream, StreamView


streamviews = Blueprint('streamviews', __name__)


@streamviews.route('/streamview/<int:stream_id>', methods=['POST'])
async def apiStreamViewAdd(stream_id: int):
    """Add new view to existing stream.

    This API call will fail if the stream given by streamid does not exist.

    Args:
        streamid: Stream to add view to. Type: int.
    """
    if request.headers['Content-Type'] == 'application/json':
        data_json = await request.json
        db_stream = db.session.query(Stream).filter_by(id=stream_id).first()
        db_streamview = StreamView(
            stream=db_stream,
            url=data_json['url'],
            crop_x1=data_json['crop_x1'],
            crop_x2=data_json['crop_x2'],
            crop_y1=data_json['crop_y1'],
            crop_y2=data_json['crop_y2'],
        )
        db.session.add(db_streamview)
        db.session.commit()
        return jsonify(db_streamview.serialize())
    else:
        abort(400)


@streamviews.route('/streamviews/<int:streamview_id>', methods=['POST', 'DELETE'])
async def apiStreamViewUpdate(streamview_id: int):
    """Update or delete existing stream view.

    This API call will fail if the streamview given by streamviewid does not exist.

    Args:
        streamviewid: Streamview to modify. Type: int.
    """
    if request.method == 'POST':
        if request.headers['Content-Type'] == 'application/json':
            data_json = await request.json
            db_streamview = db.session.query(StreamView).filter_by(id=streamview_id).first()
            db_streamview.url = data_json['url']
            db_streamview.crop_x1 = data_json['crop_x1']
            db_streamview.crop_x2 = data_json['crop_x2']
            db_streamview.crop_y1 = data_json['crop_y1']
            db_streamview.crop_y2 = data_json['crop_y2']
            db.session.commit()
            return jsonify(db_streamview.serialize())
        abort(400)
    elif request.method == 'DELETE':
        db.session.query(StreamView).filter_by(id=streamview_id).delete()
        db.session.commit()
        return jsonify('ok')
