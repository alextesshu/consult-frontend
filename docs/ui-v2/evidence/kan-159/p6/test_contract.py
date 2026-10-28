import pytest
from unittest.mock import Mock
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from booking.models import TherapistProfile
pytestmark=pytest.mark.django_db
PASSWORD='Disposable-Local-Contract-42!'
@pytest.fixture(autouse=True)
def no_external_side_effects(monkeypatch):
    monkeypatch.setattr('core.api_views.send_signup_welcome_email', Mock())
    monkeypatch.setattr('core.api_views.notify_founders_specialist_registered', Mock())
@pytest.mark.parametrize('specialist',[True,False])
def test_actual_registration_login_me(specialist):
    client=APIClient()
    payload={'email':'local-contract@example.test','password':PASSWORD,'registration_contract_version':2,'first_name':'Олена'}
    if specialist: payload['professional_focus']='psychological_practice'
    endpoint='/api/auth/signup/' if specialist else '/api/auth/signup-client/'
    result=client.post(endpoint,payload,format='json')
    assert result.status_code==201, result.data
    assert 'password_confirm' not in payload
    user=get_user_model().objects.get(pk=result.data['user']['id'])
    assert user.first_name=='Олена'
    if specialist:
        profile=TherapistProfile.objects.get(therapist=user)
        assert profile.professional_focus=='psychological_practice'
        assert not profile.public_profile_enabled and not profile.is_search_visible
    login=client.post('/api/auth/token/',{'email':payload['email'],'password':PASSWORD},format='json')
    assert login.status_code==200, login.data
    client.credentials(HTTP_AUTHORIZATION='Bearer '+login.data['access'])
    me=client.get('/api/me/')
    assert me.status_code==200, me.data
    assert me.data['user']['id']==user.id
    assert user.check_password(PASSWORD)
@pytest.mark.parametrize('specialist,missing',[(True,'first_name'),(False,'first_name'),(True,'professional_focus')])
def test_missing_v2_field_does_not_create_account(specialist,missing):
    payload={'email':'invalid-local@example.test','password':PASSWORD,'registration_contract_version':2,'first_name':'Олена','professional_focus':'other'}
    del payload[missing]
    endpoint='/api/auth/signup/' if specialist else '/api/auth/signup-client/'
    response=APIClient().post(endpoint,payload,format='json')
    assert response.status_code==400
    assert set(response.data)=={missing}
    assert not get_user_model().objects.exists()
