import os


class ConfigCommon:
    """
    Common configurations
    """

    PULSAR_URL = 'pulsar://localhost:6650'
    # well, this is not very safe obviously as it is also inside version control
    # However, this is an isolated system that is not exposed online and the
    # mysql process allows only local connections
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://raspimgmt:raspberrypi@localhost/raspimgmt?charset=utf8'
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class ProductionConfig(ConfigCommon):
    """
    Production configurations
    """

    DEBUG = False


app_config = ProductionConfig


def app_envs() -> dict:
    d = {}
    env_names = ['DEBUG', 'SQLALCHEMY_DATABASE_URI', 'PULSAR_URL']
    for env_name in env_names:
        env = os.getenv(env_name)
        if env is not None:
            d[env_name] = env
    return d