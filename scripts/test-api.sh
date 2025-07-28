#!/bin/bash

# Script para testar os endpoints de API relacionados a pacientes e médicos
# Autor: Cascade AI
# Data: $(date +%Y-%m-%d)

# Cores para melhor visualização
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
BASE_URL="http://localhost:3000"
AUTH_ENDPOINT="/api/v2/auth/login"

# Função para exibir mensagens de ajuda
show_help() {
  echo -e "${BLUE}Script de Teste de API - Endpoints de Paciente e Médico${NC}"
  echo ""
  echo "Uso: $0 [opções]"
  echo ""
  echo "Opções:"
  echo "  -e, --email EMAIL      Email do paciente para autenticação"
  echo "  -p, --password SENHA   Senha do paciente para autenticação"
  echo "  -i, --patient-id ID    ID do paciente para testar endpoints"
  echo "  -d, --doctor-id ID     ID do médico para testar endpoint específico"
  echo "  -u, --url URL          URL base (padrão: http://localhost:3000)"
  echo "  -h, --help             Exibe esta mensagem de ajuda"
  echo ""
  echo "Exemplo:"
  echo "  $0 --email paciente@exemplo.com --password senha123 --patient-id user_123 --doctor-id doc_456"
  exit 0
}

# Processar argumentos da linha de comando
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -e|--email)
      EMAIL="$2"
      shift 2
      ;;
    -p|--password)
      PASSWORD="$2"
      shift 2
      ;;
    -i|--patient-id)
      PATIENT_ID="$2"
      shift 2
      ;;
    -d|--doctor-id)
      DOCTOR_ID="$2"
      shift 2
      ;;
    -u|--url)
      BASE_URL="$2"
      shift 2
      ;;
    -h|--help)
      show_help
      ;;
    *)
      echo -e "${RED}Opção desconhecida: $1${NC}"
      show_help
      ;;
  esac
done

# Verificar se os parâmetros obrigatórios foram fornecidos
if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ] || [ -z "$PATIENT_ID" ]; then
  echo -e "${RED}Erro: Email, senha e ID do paciente são obrigatórios.${NC}"
  show_help
fi

# Função para fazer login e obter token JWT
get_token() {
  echo -e "${YELLOW}Autenticando usuário $EMAIL...${NC}"
  
  # Fazer requisição de login
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL$AUTH_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")
  
  # Extrair token JWT da resposta
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
  
  if [ -z "$TOKEN" ]; then
    echo -e "${RED}Falha na autenticação. Resposta:${NC}"
    echo $LOGIN_RESPONSE | json_pp
    exit 1
  else
    echo -e "${GREEN}Autenticação bem-sucedida!${NC}"
    echo -e "${BLUE}Token: ${NC}$TOKEN"
    echo ""
    return 0
  fi
}

# Função para testar o endpoint de listar médicos (com ID do paciente na URL)
test_list_doctors() {
  echo -e "${YELLOW}Testando endpoint para listar médicos do paciente $PATIENT_ID (com ID na URL)...${NC}"
  
  # Fazer requisição para listar médicos
  DOCTORS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v2/patients/$PATIENT_ID/doctors" \
    -H "Authorization: Bearer $TOKEN")
  
  echo -e "${GREEN}Resposta:${NC}"
  echo $DOCTORS_RESPONSE | json_pp
  echo ""
  return 0
}

# Função para testar o novo endpoint de listar médicos (sem ID do paciente na URL)
test_list_doctors_from_token() {
  echo -e "${YELLOW}Testando novo endpoint para listar médicos do paciente (ID do token)...${NC}"
  
  # Fazer requisição para listar médicos usando o novo endpoint
  DOCTORS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v2/patients/doctors" \
    -H "Authorization: Bearer $TOKEN")
  
  echo -e "${GREEN}Resposta:${NC}"
  echo $DOCTORS_RESPONSE | json_pp
  echo ""
  return 0
}

# Função para testar o endpoint de detalhes do médico e prescrições (com ID do paciente na URL)
test_doctor_details() {
  if [ -z "$DOCTOR_ID" ]; then
    echo -e "${YELLOW}ID do médico não fornecido. Pulando teste de detalhes do médico.${NC}"
    return 0
  }
  
  echo -e "${YELLOW}Testando endpoint para obter detalhes do médico $DOCTOR_ID e prescrições para o paciente $PATIENT_ID (com ID na URL)...${NC}"
  
  # Fazer requisição para obter detalhes do médico e prescrições
  DETAILS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v2/patients/$PATIENT_ID/doctors/$DOCTOR_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  echo -e "${GREEN}Resposta:${NC}"
  echo $DETAILS_RESPONSE | json_pp
  echo ""
  return 0
}

# Função para testar o novo endpoint de detalhes do médico e prescrições (sem ID do paciente na URL)
test_doctor_details_from_token() {
  if [ -z "$DOCTOR_ID" ]; then
    echo -e "${YELLOW}ID do médico não fornecido. Pulando teste de detalhes do médico.${NC}"
    return 0
  }
  
  echo -e "${YELLOW}Testando novo endpoint para obter detalhes do médico $DOCTOR_ID e prescrições (ID do paciente do token)...${NC}"
  
  # Fazer requisição para obter detalhes do médico e prescrições usando o novo endpoint
  DETAILS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v2/patients/doctors/$DOCTOR_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  echo -e "${GREEN}Resposta:${NC}"
  echo $DETAILS_RESPONSE | json_pp
  echo ""
  return 0
}

# Executar testes
echo -e "${BLUE}=== Iniciando testes de API ===${NC}"
echo -e "${BLUE}URL Base: ${NC}$BASE_URL"
echo -e "${BLUE}Paciente ID: ${NC}$PATIENT_ID"
if [ ! -z "$DOCTOR_ID" ]; then
  echo -e "${BLUE}Médico ID: ${NC}$DOCTOR_ID"
fi
echo ""

# Obter token JWT
get_token

# Testar endpoints
echo -e "${BLUE}=== Testando endpoints originais (com ID do paciente na URL) ===${NC}"
test_list_doctors
test_doctor_details

echo -e "${BLUE}=== Testando novos endpoints (ID do paciente do token JWT) ===${NC}"
test_list_doctors_from_token
test_doctor_details_from_token

echo -e "${GREEN}=== Testes concluídos ===${NC}"
