# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import io
import uuid
from quart import abort, Blueprint, request, jsonify
from minio.error import (ResponseError, BucketAlreadyOwnedByYou,
                         BucketAlreadyExists)
from urllib3.exceptions import MaxRetryError

from app.app import minio_client
from app.logger import logger


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
        return jsonify(object_id)
    abort(400)


minioInit()
