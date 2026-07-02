import { useSearchParams } from 'react-router-dom'
import { IconDiff, IconChart, IconStore } from '../components/Icons'

const T = {
  rausch: '#ff385c',
  ink: '#222222',
  muted: '#6a6a6a',
  canvas: '#ffffff',
  hairline: '#dddddd',
  surface: '#f7f7f7',
  track: '#ebebeb',
}

export default function CompareProjects() {
  const [searchParams] = useSearchParams()
  const projects = searchParams.get('projects') || ''

  const projectList = projects
    ? projects.split(',').filter(Boolean)
    : []

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ marginTop: '64px', marginBottom: '32px' }}>
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 500,
            lineHeight: 1.18,
            letterSpacing: '-0.44px',
            color: T.ink,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconDiff size={22} />
          品类对比分析
        </h2>
        <p style={{ fontSize: '14px', color: T.muted }}>
          {projectList.length > 0
            ? `正在对比 ${projectList.length} 个项目`
            : '从机会洞察页选择多个项目进行对比分析'}
        </p>
      </div>

      {/* Placeholder card */}
      <div
        style={{
          borderRadius: '14px',
          border: `1px solid ${T.hairline}`,
          backgroundColor: T.surface,
          padding: '64px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <IconStore size={32} />
          <span style={{ fontSize: '32px', color: T.hairline }}>vs</span>
          <IconChart size={32} />
        </div>
        <h3
          style={{
            fontSize: '22px',
            fontWeight: 500,
            lineHeight: 1.18,
            letterSpacing: '-0.44px',
            color: T.ink,
            marginBottom: '8px',
          }}
        >
          功能开发中
        </h3>
        <p style={{ fontSize: '14px', color: T.muted, maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
          多品类横向对比功能正在开发中。届时你可以并排对比不同品类的 9 维度评分、
          机会矩阵和痛点聚类，辅助跨品类选品决策。
        </p>

        {projectList.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <p style={{ fontSize: '13px', color: T.muted, marginBottom: '8px' }}>当前选择的项目：</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {projectList.map((id) => (
                <span
                  key={id}
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    backgroundColor: T.canvas,
                    border: `1px solid ${T.hairline}`,
                    color: T.ink,
                    fontFamily: 'monospace',
                  }}
                >
                  {id}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
