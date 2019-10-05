# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import io
import uuid
from quart import abort, Blueprint, request, jsonify, make_response, send_file
from minio.error import (ResponseError, BucketAlreadyOwnedByYou,
                         BucketAlreadyExists)
from urllib3.exceptions import MaxRetryError

from app import db
from app.app import minio_client
from app.logger import logger
from app.models import File


files = Blueprint('files', __name__)

_BUCKET = 'images'


def minioInit():
    try:
        minio_client.make_bucket(_BUCKET)
    except BucketAlreadyOwnedByYou as err:
        logger.error('minio_client was unable to create bucket: {}'.format(err))
        pass
    except BucketAlreadyExists as err:
        logger.error('minio_client was unable to create bucket: {}'.format(err))
        pass
    except MaxRetryError as err:
        logger.error('minio_client was unable to create bucket: {}'.format(err))
        pass
    except ResponseError as err:
        logger.error('minio_client was unable to create bucket: {}'.format(err))
        raise


@files.route('/file/upload', methods = ['POST'])
async def fileUpload():
    if 'multipart/form-data' in request.headers['Content-Type']:
        files = await request.files
        object_id = uuid.uuid1().hex
        data = files['file'].read()
        minio_client.put_object(_BUCKET, object_id, io.BytesIO(data), len(data))
        logger.info('Uploading object with id: {}'.format(object_id))

        file_asset = File(
            name=object_id,
            content_type=files['file'].content_type,
        )
        db.session.add(file_asset)
        db.session.commit()

        return jsonify(object_id)
    abort(400)


@files.route('/file/<string:object_name>', methods = ['GET'])
async def fileView(object_name: str):
    file_asset = db.session.query(File).filter_by(name=object_name).first()

    http_response = minio_client.get_object(_BUCKET, file_asset.name)
    image_data = http_response.data
    response = await make_response(image_data)
    response.headers['Content-Type'] = file_asset.content_type
    return response


minioInit()
