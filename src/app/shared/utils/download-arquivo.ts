const PADRAO_NOME_ARQUIVO_CONTENT_DISPOSITION = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i

export function iniciarDownloadPorUrl(urlArquivo: string, nomeArquivo = '') {
  const linkDownload = document.createElement('a')
  linkDownload.href = urlArquivo
  linkDownload.download = nomeArquivo
  linkDownload.rel = 'noopener'
  document.body.appendChild(linkDownload)
  linkDownload.click()
  linkDownload.remove()
}

export function salvarArquivoNoDispositivo(conteudo: Blob, nomeArquivo: string) {
  const urlTemporaria = URL.createObjectURL(conteudo)
  iniciarDownloadPorUrl(urlTemporaria, nomeArquivo)
  setTimeout(() => URL.revokeObjectURL(urlTemporaria))
}

export function extrairNomeArquivo(cabecalhoContentDisposition: string | null): string | null {
  const resultadoBusca = cabecalhoContentDisposition?.match(
    PADRAO_NOME_ARQUIVO_CONTENT_DISPOSITION,
  )
  return resultadoBusca ? decodeURIComponent(resultadoBusca[1]) : null
}
