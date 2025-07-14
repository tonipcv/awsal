#!/bin/bash

# Fazer login e capturar o cookie de sessão
COOKIE=$(curl -s -c - -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "muttacao.ia@gmail.com",
    "password": "12be14To!",
    "redirect": false
  }' | grep next-auth.session-token | awk '{print $7}')

# Testar a edição do protocolo com o cookie de sessão
curl -X PUT http://localhost:3000/api/protocols/cmcb5hdtl0001jd5hx0yufuli \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$COOKIE" \
  -d '{
    "name": "Protocolo de Teste",
    "description": "Descrição do protocolo",
    "isTemplate": false,
    "showDoctorInfo": true,
    "modalTitle": "",
    "modalVideoUrl": "",
    "modalDescription": "",
    "modalButtonText": "",
    "modalButtonUrl": "",
    "coverImage": "",
    "consultation_date": null,
    "onboardingTemplateId": null,
    "days": [
      {
        "dayNumber": 1,
        "title": "Dia 1",
        "sessions": [
          {
            "name": "Sessão Principal",
            "order": 0,
            "tasks": []
          }
        ]
      },
      {
        "dayNumber": 2,
        "title": "Dia 2",
        "sessions": [
          {
            "name": "Sessão Principal",
            "order": 0,
            "tasks": []
          }
        ]
      }
    ]
  }' 