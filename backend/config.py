class Config(object):
    """
    Common configurations
    """

    # well, this is not very safe obviously as it is also inside version control
    # However, this is an isolated system that is not exposed online and the
    # mysql process allows only local connections
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://raspimgmt:raspberrypi@localhost/raspimgmt?charset=utf8'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    """
    Development configurations
    """

    DEBUG = True
    SQLALCHEMY_ECHO = True

class ProductionConfig(Config):
    """
    Production configurations
    """

    DEBUG = False

app_config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig
}