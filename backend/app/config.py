import os


class ConfigCommon:
    """
    Common configurations
    """

    MINIO_URL = 'localhost:9000'
    MINIO_ACCESS_KEY = 'THIS_IS_NOT_AN_ACCESS_KEY'
    MINIO_SECRET_KEY = 'THIS_IS_NOT_A_SECRET_KEY'
    # well, this is not very safe obviously as it is also inside version control
    # However, this is an isolated system that is not exposed online and the
    # mysql process allows only local connections
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://raspimgmt:raspberrypi@localhost/raspimgmt?charset=utf8'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_POOL_RECYCLE = 3600


class ProductionConfig(ConfigCommon):
    """
    Production configurations
    """

    DEBUG = False


app_config = ProductionConfig


def app_envs() -> dict:
    d = {}
    env_names = [
        'DEBUG',
        'MINIO_URL',
        'MINIO_ACCESS_KEY',
        'MINIO_SECRET_KEY',
        'SQLALCHEMY_DATABASE_URI',
    ]
    for env_name in env_names:
        env = os.getenv(env_name)
        if env is not None:
            d[env_name] = env
    return d