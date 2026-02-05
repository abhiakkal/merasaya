import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useApi } from '../../hooks/useApi';

export default function FunctionRunner() {
  const { t } = useTranslation();
  const { post, loading } = useApi();
  
  const [functionType, setFunctionType] = useState<'npm' | 'rag'>('npm');
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<string>('');

  const handleExecute = async () => {
    setOutput('Executing...');
    
    const endpoint = functionType === 'npm' ? '/admin/run-npm' : '/admin/run-rag';
    const payload = functionType === 'npm' 
      ? { command } 
      : { query: command };

    const data = await post(endpoint, payload);
    
    if (data) {
      setOutput(data.output || data.result || JSON.stringify(data, null, 2));
    } else {
      setOutput('Error executing function');
    }
  };

  return (
    <div className="admin-container">
      <h1>{t('function_runner')}</h1>

      <div className="form-card">
        <div className="form-group">
          <label>{t('function_type')}</label>
          <select
            value={functionType}
            onChange={(e) => setFunctionType(e.target.value as 'npm' | 'rag')}
            className="input"
          >
            <option value="npm">NPM Command</option>
            <option value="rag">RAG Query</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            {functionType === 'npm' ? t('npm_command') : t('rag_query')}
          </label>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={functionType === 'npm' ? 'npm install package-name' : 'Search query...'}
            className="input"
            dir="ltr"
          />
        </div>

        <button onClick={handleExecute} className="btn-primary" disabled={loading || !command}>
          {loading ? 'Executing...' : t('execute')}
        </button>

        {output && (
          <div className="output-container">
            <h3>{t('output')}</h3>
            <pre className="output-box">{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common']))
    },
  };
}