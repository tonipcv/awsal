# Migração: Cover Image para Cursos

Este documento descreve como implementar o campo `coverImage` no modelo Course, seguindo o mesmo padrão do modelo Protocol.

## 📋 Resumo da Implementação

### ✅ Já Implementado:
1. **Schema Prisma**: Campo `coverImage String?` adicionado ao modelo Course
2. **Scripts de Migração**: Scripts Node.js para aplicar as mudanças no banco

### 🔄 Próximos Passos:
1. Executar a migração no banco de dados
2. Atualizar componentes React para incluir coverImage
3. Implementar upload de imagens
4. Atualizar formulários de criação/edição

## 🚀 Como Executar a Migração

### Opção 1: Script Simples
```bash
node add-cover-image-to-course.js
```

### Opção 2: Script Completo (Recomendado)
```bash
# Executar a migração completa
node migrate-course-cover-image.js migrate

# Listar cursos sem coverImage
node migrate-course-cover-image.js list

# Atualizar um curso específico
node migrate-course-cover-image.js update <courseId> <imageUrl>
```

## 📊 Comparação: Protocol vs Course

### Modelo Protocol (Referência):
```prisma
model Protocol {
  id          String  @id @default(cuid())
  name        String
  description String?
  coverImage  String?  // ✅ Campo existente
  // ... outros campos
}
```

### Modelo Course (Atualizado):
```prisma
model Course {
  id          String  @id @default(cuid())
  title       String
  description String?
  thumbnail   String?  // Campo existente
  coverImage  String?  // ✅ Campo adicionado
  // ... outros campos
}
```

## 🔧 Estrutura dos Scripts

### `add-cover-image-to-course.js`
- Script simples para adicionar o campo
- Executa SQL diretamente
- Inclui verificações básicas

### `migrate-course-cover-image.js`
- Script completo com múltiplas funcionalidades
- Comandos: `migrate`, `list`, `update`
- Regenera cliente Prisma automaticamente
- Estatísticas detalhadas

## 📝 Comandos Disponíveis

```bash
# Migração completa
node migrate-course-cover-image.js migrate

# Listar cursos sem coverImage
node migrate-course-cover-image.js list

# Atualizar curso específico
node migrate-course-cover-image.js update curso123 https://example.com/image.jpg

# Ver ajuda
node migrate-course-cover-image.js
```

## 🎯 Próximas Implementações

### 1. Componentes React
Atualizar formulários de curso para incluir upload de coverImage:

```jsx
// Exemplo de campo no formulário
<div className="space-y-2">
  <Label htmlFor="coverImage">Cover Image</Label>
  <Input
    id="coverImage"
    name="coverImage"
    type="url"
    placeholder="URL da imagem de capa"
    value={formData.coverImage || ''}
    onChange={handleInputChange}
  />
</div>
```

### 2. API Routes
Atualizar endpoints de criação/edição de cursos:

```javascript
// Em /api/courses/route.ts
const courseData = {
  title,
  description,
  thumbnail,
  coverImage, // ✅ Novo campo
  // ... outros campos
};
```

### 3. Componentes de Exibição
Atualizar cards e páginas de curso para mostrar coverImage:

```jsx
// Prioridade: coverImage > thumbnail > imagem padrão
const imageUrl = course.coverImage || course.thumbnail || '/default-course.jpg';
```

## 🔍 Verificação Pós-Migração

Após executar a migração, verifique:

1. **Banco de dados**: Campo `coverImage` existe na tabela `courses`
2. **Prisma Client**: Execute `npx prisma generate` se necessário
3. **Tipos TypeScript**: Verifique se `Course.coverImage` está disponível

## 🚨 Troubleshooting

### Erro: "Column already exists"
```bash
# Se o campo já existe, o script detecta automaticamente
# Nenhuma ação necessária
```

### Erro: "Prisma generate failed"
```bash
# Execute manualmente
npx prisma generate
```

### Erro: "Database connection"
```bash
# Verifique se o DATABASE_URL está configurado
# Verifique se o banco PostgreSQL está rodando
```

## 📈 Estatísticas Esperadas

Após a migração, você verá:
- Total de cursos existentes
- Cursos com thumbnail
- Cursos com coverImage (inicialmente 0)
- Sugestões de próximos passos

## 🎉 Conclusão

Esta implementação segue exatamente o padrão do modelo Protocol, garantindo consistência na aplicação. O campo `coverImage` agora está disponível para todos os cursos, permitindo uma experiência visual mais rica.

### Benefícios:
- ✅ Consistência com o modelo Protocol
- ✅ Flexibilidade: thumbnail + coverImage
- ✅ Retrocompatibilidade: cursos existentes não são afetados
- ✅ Fácil implementação nos componentes React 