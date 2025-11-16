from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.authentication.models import Company, CompanyUser
from apps.emails.models import EmailAccount


User = get_user_model()


class EmailAccountTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', email='tester@example.com', password='pass123', account_type='company')
        self.company = Company.objects.create(company_name='TestCo', created_by=self.user)
        CompanyUser.objects.create(user=self.user, company=self.company, role='ceo')
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_create_email_account(self):
        payload = {
            'email': 'tester@example.com',
            'provider': 'smtp',
            'smtp_host': 'smtp.test',
            'smtp_port': 587,
            'username': 'tester@example.com',
            'password': 'secret-app-pass'
        }
        res = self.client.post('/api/emails/accounts/', payload, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(EmailAccount.objects.count(), 1)

    def test_list_accounts(self):
        EmailAccount.objects.create(user=self.user, company=self.company, email='tester@example.com', provider='smtp', username='tester@example.com', password='x')
        res = self.client.get('/api/emails/accounts/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 1)


class EmailSendTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='sender', email='sender@example.com', password='pass123', account_type='company')
        self.company = Company.objects.create(company_name='SendCo', created_by=self.user)
        CompanyUser.objects.create(user=self.user, company=self.company, role='ceo')
        self.account = EmailAccount.objects.create(user=self.user, company=self.company, email='sender@example.com', provider='smtp', username='sender@example.com', password='x', is_default=True)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_send_email_minimal(self):
        payload = {
            'to_emails': ['recipient@example.com'],
            'subject': 'Hello',
            'body_html': '<p>Hello</p>'
        }
        res = self.client.post('/api/emails/send/', payload, format='json')
        # We expect a 201 and an Email object; send task may not run in test env
        self.assertEqual(res.status_code, 201)
        self.assertIn('subject', res.json())

    def test_reply_email(self):
        # send original
        orig = self.client.post('/api/emails/send/', {
            'to_emails': ['r@example.com'],
            'subject': 'Orig',
            'body_html': '<p>Body</p>'
        }, format='json').json()
        res = self.client.post(f"/api/emails/emails/{orig['id']}/reply/", {
            'to_emails': ['r@example.com'],
            'body_html': '<p>Reply</p>'
        }, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.json()['subject'].startswith('Re:'))

    def test_template_usage_increment(self):
        # create template
        tmpl_res = self.client.post('/api/emails/templates/', {
            'name': 'Welcome',
            'subject': 'Welcome {company_name}',
            'body_html': '<p>Hello</p>',
            'category': 'general'
        }, format='json')
        self.assertEqual(tmpl_res.status_code, 201)
        tmpl_id = tmpl_res.json()['id']
        # send using template
        send_res = self.client.post('/api/emails/send/', {
            'to_emails': ['r@example.com'],
            'subject': 'placeholder',
            'template_id': tmpl_id
        }, format='json')
        self.assertEqual(send_res.status_code, 201)
        # fetch template detail
        detail = self.client.get(f'/api/emails/templates/{tmpl_id}/').json()
        self.assertEqual(detail['usage_count'], 1)

class EmailSearchCategoriesTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='searcher', email='searcher@example.com', password='pass123', account_type='company')
        self.company = Company.objects.create(company_name='SearchCo', created_by=self.user)
        CompanyUser.objects.create(user=self.user, company=self.company, role='ceo')
        self.account = EmailAccount.objects.create(user=self.user, company=self.company, email='searcher@example.com', provider='smtp', username='searcher@example.com', password='x', is_default=True)
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        # create few emails (simulate threads by sending separate subjects)
        for subj in ['Alpha Meeting', 'Beta Followup', 'Gamma Report']:
            self.client.post('/api/emails/send/', {
                'to_emails': ['a@example.com'],
                'subject': subj,
                'body_html': '<p>Content</p>'
            }, format='json')
    def test_search(self):
        res = self.client.get('/api/emails/search/?q=Beta')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 1)
    def test_categories(self):
        res = self.client.get('/api/emails/categories/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('categories', res.json())
