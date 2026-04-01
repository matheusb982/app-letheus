export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Última atualização: 01 de abril de 2026
      </p>

      <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Introdução</h2>
          <p>
            O Letheus IA Financeira (&quot;Letheus&quot;, &quot;nós&quot;) valoriza a privacidade dos seus usuários.
            Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos seus dados,
            em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Dados Pessoais Coletados</h2>
          <h3 className="text-lg font-medium mt-4 mb-2">2.1 Dados de Cadastro</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Nome completo</strong> -para identificação no sistema</li>
            <li><strong>Email</strong> -para autenticação e comunicação</li>
            <li><strong>Senha</strong> -armazenada com criptografia bcrypt (nunca em texto puro)</li>
          </ul>

          <h3 className="text-lg font-medium mt-4 mb-2">2.2 Dados Financeiros</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Despesas (valor, data, descrição, categoria)</li>
            <li>Receitas (valor, nome da fonte, descrição)</li>
            <li>Metas de gastos por categoria</li>
            <li>Patrimônio (investimentos e seus valores)</li>
            <li>Categorias e subcategorias personalizadas</li>
          </ul>

          <h3 className="text-lg font-medium mt-4 mb-2">2.3 Dados de Uso</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Conversas com o assistente de IA (perguntas e respostas)</li>
            <li>Feedbacks enviados</li>
            <li>Registros de auditoria (ações de gestão de família)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Finalidade do Tratamento</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Dado</th>
                <th className="text-left py-2 pr-4">Finalidade</th>
                <th className="text-left py-2">Base Legal (LGPD)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4">Nome e email</td>
                <td className="py-2 pr-4">Autenticação e identificação</td>
                <td className="py-2">Execução de contrato (Art. 7, V)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Senha (hash)</td>
                <td className="py-2 pr-4">Segurança de acesso</td>
                <td className="py-2">Execução de contrato (Art. 7, V)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Dados financeiros</td>
                <td className="py-2 pr-4">Gestão financeira e análises</td>
                <td className="py-2">Execução de contrato (Art. 7, V)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Dados financeiros (IA)</td>
                <td className="py-2 pr-4">Classificação, sugestões e chat</td>
                <td className="py-2">Consentimento (Art. 7, I)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Logs de auditoria</td>
                <td className="py-2 pr-4">Segurança e rastreabilidade</td>
                <td className="py-2">Interesse legítimo (Art. 7, IX)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Feedbacks</td>
                <td className="py-2 pr-4">Melhoria do serviço</td>
                <td className="py-2">Interesse legítimo (Art. 7, IX)</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-4 text-muted-foreground">
            Ao utilizar funcionalidades de inteligência artificial, você concorda com o envio
            dos dados necessários para processamento pelos provedores mencionados nesta política.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Compartilhamento com Terceiros</h2>
          <p>
            Seus dados financeiros (valores, descrições de transações, categorias) são enviados a
            provedores de inteligência artificial para processamento:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>
              <strong>OpenAI (GPT-4o)</strong> -classificação de despesas, sugestão de metas e chat financeiro.
              <br />
              <a href="https://openai.com/privacy" className="text-primary underline text-xs" target="_blank" rel="noopener noreferrer">https://openai.com/privacy</a>
            </li>
            <li>
              <strong>Google (Gemini 2.5 Flash)</strong> -provedor de fallback quando o principal está indisponível.
              <br />
              <a href="https://policies.google.com/privacy" className="text-primary underline text-xs" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a>
            </li>
          </ul>
          <div className="bg-muted/50 border rounded-lg p-4 mt-3">
            <p className="font-medium">O que NÃO é compartilhado com provedores de IA:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Seu nome ou email</li>
              <li>Sua senha</li>
              <li>Dados de outros membros da família</li>
              <li>Dados de identificação pessoal</li>
            </ul>
          </div>
          <p className="mt-3">
            Os provedores de IA atuam como operadores de dados, processando informações
            exclusivamente para as finalidades descritas nesta política.
          </p>
          <p className="mt-2">
            Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing ou publicidade.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Armazenamento e Segurança</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Dados armazenados em banco de dados MongoDB com criptografia em trânsito (TLS/SSL).</li>
            <li>Senhas criptografadas com bcrypt (12 rounds de salt).</li>
            <li>Sessões gerenciadas via JWT (JSON Web Token) com cookies HttpOnly e Secure. Proteções adicionais contra CSRF e XSS são aplicadas.</li>
            <li>Isolamento de dados por família (multi-tenancy) -uma família não acessa dados de outra.</li>
            <li>Respostas do chat cacheadas por até 3 horas e automaticamente deletadas após expiração.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Retenção de Dados</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Dado</th>
                <th className="text-left py-2">Período de Retenção</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4">Conta e dados financeiros</td>
                <td className="py-2">Enquanto a conta existir</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Conversas com IA</td>
                <td className="py-2">Enquanto a conta existir (deletável pelo usuário)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Cache de respostas da IA</td>
                <td className="py-2">3 horas (exclusão automática)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Dados de exemplo (onboarding)</td>
                <td className="py-2">Até a primeira importação real (exclusão automática)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Logs de auditoria</td>
                <td className="py-2">Enquanto a família existir (anonimizados em exclusão de membro)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Feedbacks</td>
                <td className="py-2">Enquanto relevante (exclusão pelo administrador)</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Seus Direitos (LGPD Art. 18)</h2>
          <p>Você tem o direito de:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Acesso</strong> -visualizar todos os seus dados no sistema a qualquer momento.</li>
            <li><strong>Correção</strong> -editar suas informações pessoais e financeiras.</li>
            <li><strong>Exclusão</strong> -excluir sua conta (membro) ou toda a família (owner). Dados pessoais são removidos e referências anonimizadas.</li>
            <li><strong>Portabilidade</strong> -exportar seus dados financeiros (funcionalidade em desenvolvimento).</li>
            <li><strong>Revogação do consentimento</strong> -excluir sua conta para revogar o consentimento de processamento de dados.</li>
            <li><strong>Informação sobre compartilhamento</strong> -esta política detalha todos os terceiros com acesso aos seus dados.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Exclusão e Anonimização</h2>
          <h3 className="text-lg font-medium mt-4 mb-2">8.1 Exclusão de Membro</h3>
          <p>Ao excluir sua conta como membro:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Seus dados pessoais (nome, email, senha) são permanentemente removidos.</li>
            <li>Suas conversas com IA são desvinculadas (user_id removido).</li>
            <li>Referências em logs de auditoria são anonimizadas (&quot;Usuário removido&quot;).</li>
            <li>Dados financeiros da família são preservados (pertencem à família).</li>
          </ul>

          <h3 className="text-lg font-medium mt-4 mb-2">8.2 Exclusão de Família</h3>
          <p>Ao excluir a família (apenas owner):</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Todos os dados financeiros são permanentemente removidos.</li>
            <li>Todas as contas de membros são removidas.</li>
            <li>Todos os logs, conversas, cache e regras de classificação são removidos.</li>
            <li>Esta ação é irreversível.</li>
          </ul>

          <h3 className="text-lg font-medium mt-4 mb-2">8.3 Prazo</h3>
          <p>
            A exclusão dos dados ocorre de forma imediata ou em até 30 dias,
            conforme necessidade técnica de processamento.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Cookies e Sessão</h2>
          <p>Utilizamos apenas cookies essenciais para funcionamento:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li><strong>Cookie de sessão (JWT)</strong> -autenticação do usuário. HttpOnly, Secure, SameSite: Lax. Expira em 30 dias.</li>
          </ul>
          <p className="mt-2">
            Não utilizamos cookies de rastreamento, analytics ou publicidade.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Menores de Idade</h2>
          <p>
            O Serviço não é destinado a menores de 18 anos. Não coletamos intencionalmente dados
            de menores. Se identificarmos uma conta de menor, ela será removida.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Alterações significativas serão comunicadas
            por email ou notificação no Serviço. A data de última atualização é exibida no topo desta página.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">12. Contato e Encarregado (DPO)</h2>
          <p>
            Para exercer seus direitos ou tirar dúvidas sobre privacidade:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-3">
            <li>Email: <strong>privacidade@letheus.com.br</strong></li>
            <li>Encarregado de dados (DPO): <strong>dpo@letheus.com.br</strong></li>
          </ul>
        </section>

        <section className="border-t pt-6 mt-8">
          <p className="text-base text-muted-foreground italic">
            Nosso compromisso é tratar seus dados financeiros com o mesmo cuidado
            que gostaríamos que tratassem os nossos.
          </p>
        </section>
      </div>
    </div>
  );
}
