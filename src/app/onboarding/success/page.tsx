import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Formulário enviado com sucesso!</CardTitle>
            <CardDescription>
              Obrigado por preencher o formulário. O médico entrará em contato em breve.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
} 