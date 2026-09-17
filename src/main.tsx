import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// GitHub Pages 子目录部署：404.html 会先把原始路径存入 sessionStorage 再跳到站点根，
// 这里在应用挂载前把路径还原，保证 /zdkzyl/lab 等深链接可用
if (import.meta.env.VITE_STATIC_MODE === '1') {
  try {
    const redirect = sessionStorage.getItem('zdkzy.gh404')
    if (redirect) {
      sessionStorage.removeItem('zdkzy.gh404')
      window.history.replaceState(null, '', redirect)
    }
  } catch {
    /* sessionStorage 不可用时忽略 */
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
