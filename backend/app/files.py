# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import io
import uuid
from quart import abort, Blueprint, request, jsonify, make_response, send_file
from minio.error import (ResponseError, BucketAlreadyOwnedByYou,
                         BucketAlreadyExists, InvalidAccessKeyId)
from urllib3.exceptions import MaxRetryError

from app import db, minio_client
from logger import logger
from models import File

files = Blueprint('files', __name__)

_BUCKET = 'images'


def minioInit():
    try:
        minio_client.make_bucket(_BUCKET)
    except BucketAlreadyOwnedByYou as err:
        logger.error(
            'minio_client was unable to create bucket: {}'.format(err))
    except BucketAlreadyExists as err:
        logger.error(
            'minio_client was unable to create bucket: {}'.format(err))
    except MaxRetryError as err:
        logger.error(
            'minio_client was unable to create bucket: {}'.format(err))
    except InvalidAccessKeyId as err:
        logger.error(
            'minio_client was unable to create bucket: {}'.format(err))
    except ResponseError as err:
        logger.error(
            'minio_client was unable to create bucket: {}'.format(err))
        raise


def minioUpload(data):
    object_id = uuid.uuid1().hex
    minio_client.put_object(_BUCKET, object_id, io.BytesIO(data), len(data))
    logger.info('Uploading object with id: {}'.format(object_id))
    return object_id


@files.route('/file/upload', methods=['POST'])
async def fileUpload():
    if 'multipart/form-data' in request.headers['Content-Type']:
        try:
            files = await request.files
            object_id = minioUpload(files['file'].read())

            file_asset = File(
                name=object_id,
                content_type=files['file'].content_type,
            )
            db.session.add(file_asset)
            db.session.commit()

            return jsonify(object_id)
        except:
            db.session.rollback()
            raise
        finally:
            db.session.close()
    abort(400)


@files.route('/file/<string:object_name>', methods=['GET'])
async def fileView(object_name: str):
    file_asset = db.session.query(File).filter_by(name=object_name).first()

    if not file_asset:
        abort(404)

    http_response = minio_client.get_object(_BUCKET, file_asset.name)
    image_data = http_response.data
    response = await make_response(image_data)
    response.headers['Content-Type'] = file_asset.content_type
    return response


minioInit()
