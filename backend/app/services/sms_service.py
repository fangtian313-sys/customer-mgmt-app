from abc import ABC, abstractmethod
import logging
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class SmsProvider(ABC):
    @abstractmethod
    async def send(self, phone: str, code: str) -> bool:
        pass


class MockSmsProvider(SmsProvider):
    async def send(self, phone: str, code: str) -> bool:
        logger.info(f"[MOCK SMS] Phone: {phone}, Code: {code}")
        return True


class AliyunSmsProvider(SmsProvider):
    def __init__(self):
        self.access_key_id = settings.ALIYUN_ACCESS_KEY_ID
        self.access_key_secret = settings.ALIYUN_ACCESS_KEY_SECRET
        self.sign_name = settings.ALIYUN_SMS_SIGN_NAME
        self.template_code = settings.ALIYUN_SMS_TEMPLATE_CODE

    async def send(self, phone: str, code: str) -> bool:
        # TODO: Implement actual Aliyun SMS API call
        logger.info(f"[Aliyun SMS] Sending to {phone}, template: {self.template_code}")
        return True


def get_sms_provider() -> SmsProvider:
    provider_type = settings.SMS_PROVIDER.lower()
    if provider_type == "aliyun":
        return AliyunSmsProvider()
    return MockSmsProvider()
