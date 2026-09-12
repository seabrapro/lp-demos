/* Amicis — site + loja (vanilla, hash router, sacola em localStorage, checkout por WhatsApp) */
(function () {
  const L = window.LOJA;
  const $ = (s, r = document) => r.querySelector(s);
  const brl = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cat = s => L.categorias.find(c => c.slug === s);
  const prod = s => L.produtos.find(p => p.slug === s);
  const app = $('#app');
  const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4.1c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>';

  /* ---------- sacola ---------- */
  let sacola = [];
  try { sacola = JSON.parse(localStorage.getItem('amicis.sacola') || '[]'); } catch (e) { sacola = []; }
  const salvar = () => { try { localStorage.setItem('amicis.sacola', JSON.stringify(sacola)); } catch (e) { } };
  const qtdTotal = () => sacola.reduce((a, i) => a + i.qtd, 0);
  const subtotal = () => sacola.reduce((a, i) => a + i.qtd * prod(i.slug).preco, 0);

  function addSacola(slug, cor, tam, qtd) {
    const k = sacola.find(i => i.slug === slug && i.cor === cor && i.tam === tam);
    if (k) k.qtd += qtd; else sacola.push({ slug, cor, tam, qtd });
    salvar(); renderSacola(); abrirSacola();
    toast(`${prod(slug).nome} adicionado à sacola`);
  }
  function mudarQtd(i, d) { sacola[i].qtd += d; if (sacola[i].qtd <= 0) sacola.splice(i, 1); salvar(); renderSacola(); }
  function abrirSacola() { $('#sacola').classList.add('on'); $('#veu').classList.add('on'); document.body.style.overflow = 'hidden'; }
  function fecharSacola() { $('#sacola').classList.remove('on'); $('#veu').classList.remove('on'); document.body.style.overflow = ''; }

  function mensagemPedido() {
    const linhas = sacola.map(i => { const p = prod(i.slug); return `• ${i.qtd}× ${p.nome} — ${L.cores[i.cor].nome} / ${i.tam} — ${brl(p.preco * i.qtd)}`; });
    return `Olá, Amicis! Quero fazer este pedido:\n${linhas.join('\n')}\nSubtotal: ${brl(subtotal())}\n\nNome:\nEndereço:`;
  }
  /* WhatsApp com a mensagem já escrita. Com whatsNumero: cai direto na conversa da loja.
     Sem número: wa.me/?text= abre o WhatsApp com o texto pronto e pede só para escolher o contato.
     Tem que ser síncrono dentro do clique (Safari bloqueia window.open dentro de promise). */
  function urlWA(msg) {
    const t = encodeURIComponent(msg);
    return L.whatsNumero ? `https://wa.me/${L.whatsNumero}?text=${t}` : `https://wa.me/?text=${t}`;
  }
  function abrirWA(msg) {
    const url = urlWA(msg);
    const w = window.open(url, '_blank', 'noopener');
    if (!w) location.href = url;
  }
  function checkout() {
    if (!sacola.length) return;
    abrirWA(mensagemPedido());
    toast('Abrindo o WhatsApp com o seu pedido…');
  }

  function renderSacola() {
    $('#sacola-n').textContent = qtdTotal();
    $('#sacola-n').hidden = !qtdTotal();
    const box = $('#sacola-itens');
    if (!sacola.length) { box.innerHTML = '<p class="vazia">Sua sacola está vazia.<br><a href="#/loja" class="link" data-fecha>Ver a coleção</a></p>'; }
    else box.innerHTML = sacola.map((i, n) => {
      const p = prod(i.slug);
      return `<div class="si"><img src="${p.imgs[0]}" alt="" width="72" height="96" loading="lazy">
        <div class="si-b"><b>${esc(p.nome)}</b><span>${esc(L.cores[i.cor].nome)} · ${i.tam}</span>
          <div class="qt"><button data-q="${n}:-1" aria-label="Diminuir">−</button><span>${i.qtd}</span><button data-q="${n}:1" aria-label="Aumentar">+</button></div></div>
        <div class="si-p"><b>${brl(p.preco * i.qtd)}</b><button class="rm" data-rm="${n}">Remover</button></div></div>`;
    }).join('');
    const st = subtotal(), falta = L.freteGratis - st;
    $('#sacola-sub').textContent = brl(st);
    $('#frete').innerHTML = st <= 0 ? '' : falta > 0
      ? `<div class="fb"><span style="width:${Math.min(100, st / L.freteGratis * 100)}%"></span></div><small>Faltam ${brl(falta)} para o frete grátis</small>`
      : `<div class="fb"><span style="width:100%"></span></div><small>Frete grátis liberado ✓</small>`;
    $('#checkout').disabled = !sacola.length;
  }

  /* ---------- helpers de UI ---------- */
  let tt; function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 2600); }
  const sw = p => p.cores.map(k => `<i class="sw" style="background:${L.cores[k].sw}" title="${esc(L.cores[k].nome)}"></i>`).join('');
  function card(p) {
    const tag = p.tag ? `<span class="tag${p.tag === 'Novo' ? ' tag-sage' : ''}">${esc(p.tag)}</span>` : '';
    const de = p.precoDe ? ` <s>${brl(p.precoDe)}</s>` : '';
    return `<a class="card rv" href="#/produto/${p.slug}">
      <div class="card-m">${tag}<img src="${p.imgs[0]}" alt="${esc(p.nome)}" width="900" height="1200" loading="lazy">${p.imgs[1] ? `<img class="alt" src="${p.imgs[1]}" alt="" width="900" height="1200" loading="lazy">` : ''}</div>
      <div class="card-b"><span class="card-c">${esc(cat(p.cat).nome)}</span><span class="card-n">${esc(p.nome)}</span><span class="card-p">${brl(p.preco)}${de}</span><span class="card-s">${sw(p)}</span></div></a>`;
  }
  const grid = ps => `<div class="grid">${ps.map(card).join('')}</div>`;
  const btnWA = (t, cls = 'btn') => `<a class="${cls}" href="${L.whatsLink}" target="_blank" rel="noopener">${WA_ICON}<span>${t}</span></a>`;
  const crumbs = (...a) => `<nav class="crumbs"><a href="#/">Início</a>${a.map(x => x.href ? `<a href="${x.href}">${esc(x.t)}</a>` : `<span>${esc(x.t)}</span>`).join('')}</nav>`;

  /* ---------- páginas ---------- */
  const pages = {};

  pages.home = () => `
  <section class="hero" id="top">
    <div class="hero-media has-video" id="heroMedia">
      <img src="assets/img/hero-poster.jpg" width="1600" height="900" alt="" fetchpriority="high">
      <video muted loop playsinline autoplay poster="assets/img/hero-poster.jpg" preload="auto"><source src="assets/hero.mp4" type="video/mp4"></video>
    </div>
    <div class="wrap"><div class="hero-copy">
      <p class="eyebrow">Moda fitness · Fabricação própria</p>
      <h1>Feita para acompanhar <em>seu</em> ritmo.</h1>
      <p class="lead">Tecido premium, compressão perfeita e fabricação própria. Do treino ao dia a dia.</p>
      <div class="cta"><a class="btn" href="#/loja">Ver a coleção</a><a class="link" href="#/atacado">Comprar no atacado</a></div>
    </div></div>
  </section>
  <div class="marquee" aria-hidden="true"><div>${'<span>Tecido premium</span><span>Compressão perfeita</span><span>Fabricação própria</span><span>Varejo &amp; atacado</span><span>Feito em Goiânia</span>'.repeat(3)}</div></div>

  <section class="sec"><div class="wrap">
    <div class="sec-head rv row"><div><p class="eyebrow">Queridinhas da casa</p><h2>Destaques da <em>coleção.</em></h2></div><a class="link" href="#/loja">Ver tudo</a></div>
    ${grid(L.produtos.filter(p => p.tag || p.precoDe).slice(0, 4))}
  </div></section>

  <section class="sec band"><div class="wrap">
    <div class="sec-head rv"><p class="eyebrow">Por categoria</p><h2>Monte seu <em>look.</em></h2></div>
    <div class="cats">${L.categorias.map(c => `<a class="cat rv" href="#/loja?cat=${c.slug}"><img src="${c.img}" alt="" width="600" height="800" loading="lazy"><span><b>${esc(c.nome)}</b><small>${esc(c.sub)}</small></span></a>`).join('')}</div>
  </div></section>

  <section class="edit"><div class="wrap split">
    <div class="rv"><img src="assets/img/hero-flare.jpg" width="1080" height="1350" loading="lazy" alt="Conjunto Soft Era: cropped e calça flare preta"></div>
    <div class="rv"><p class="eyebrow">A Soft Era</p><h2>Clássico ou sofisticado? Na dúvida, <em>fique com os dois.</em></h2>
      <p class="lead">Os looks fitness vieram para acompanhar você, e não só no treino. Canelado macio, tons terrosos e modelagens que funcionam da esteira à rua — a coleção que a gente desenhou para o dia inteiro.</p>
      <p><a class="btn" href="#/loja?cat=conjuntos">Ver os conjuntos</a></p></div>
  </div></section>

  <section class="sec band"><div class="wrap">
    <div class="sec-head rv"><p class="eyebrow">Como é feito</p><h2>Fabricação própria. Cada detalhe <em>é nosso.</em></h2></div>
    <div class="split"><div class="rv"><img src="assets/img/detalhe-costura.jpg" width="1080" height="1440" loading="lazy" alt="Detalhe do cós e das costuras da legging de compressão"></div>
      <div class="steps rv">
        <div><span class="n">01</span><div><h3>Tecido premium</h3><p>Toque macio, opacidade total. Não marca e não transparece no agachamento.</p></div></div>
        <div><span class="n">02</span><div><h3>Compressão perfeita</h3><p>Sustenta sem apertar. Você esquece que está usando.</p></div></div>
        <div><span class="n">03</span><div><h3>Feito aqui</h3><p>Da modelagem à costura, tudo passa pela nossa mão — por isso o caimento é igual em todas as peças.</p></div></div>
      </div></div>
  </div></section>

  <section class="full"><img src="assets/img/corrida-golden.jpg" width="1080" height="1350" loading="lazy" alt="Corredora ao pôr do sol"><div class="wrap"><div class="full-copy rv">
    <p class="eyebrow">Para o treino e para a vida</p><h2>Do treino de 6h ao café <em>das 10h.</em></h2>
    <p class="lead">A Amicis nasceu na rua, nas corridas de domingo em Goiânia. As peças vieram para acompanhar o dia inteiro — não só a hora do treino.</p></div></div></section>

  <section class="sec"><div class="wrap ata">
    <div class="rv"><p class="eyebrow">Club Amicis · Atacado</p><h2>Revenda direto <em>da fábrica.</em></h2>
      <p class="lead">Fabricação própria significa preço de fábrica, grade fechada ou sortida e prazo que você consegue prometer para a sua cliente.</p></div>
    <div class="rv"><div class="list">
      <div><b>Pedido mínimo de ${L.atacadoMinimo} peças</b><span>Podendo misturar modelos.</span></div>
      <div><b>Tabela escalonada por volume</b><span>Quanto mais peças, menor o preço unitário.</span></div>
      <div><b>Conteúdo pronto</b><span>Fotos e vídeos de estúdio para você postar.</span></div></div>
      <p style="margin-top:28px"><a class="btn" href="#/atacado">Quero a tabela de atacado</a></p></div>
  </div></section>

  ${provador()}

  <section class="fin" id="contato-cta"><div class="fin-media has-video" id="finMedia">
    <img src="assets/img/cta-poster.jpg" width="1600" height="900" loading="lazy" alt="">
    <video muted loop playsinline autoplay poster="assets/img/cta-poster.jpg" preload="metadata"><source src="assets/cta.mp4" type="video/mp4"></video></div>
    <div class="wrap rv"><p class="eyebrow">Amicis Fitness</p><h2>Vem sentir <em>a diferença.</em></h2><p class="lead">Atendimento no WhatsApp, envio para todo o Brasil.</p>${btnWA('Falar no WhatsApp')}</div></section>`;

  function provador() {
    return `<section class="sec band" id="provador"><div class="wrap split">
      <div class="rv"><p class="eyebrow">Provador</p><h2>Descubra seu tamanho <em>sem sair de casa.</em></h2>
        <p class="lead">Nossa grade vai do PP ao GG com modelagem brasileira. Meça o busto, a cintura e o quadril com a fita rente ao corpo, sem apertar, e confira a tabela.</p>
        <p>${btnWA('Ainda na dúvida? Fale com a gente', 'link')}</p></div>
      <div class="rv tbl"><table><thead><tr><th>Tam.</th><th>Busto (cm)</th><th>Cintura (cm)</th><th>Quadril (cm)</th><th>Manequim</th></tr></thead>
        <tbody>${L.medidas.map(r => `<tr>${r.map((c, i) => i ? `<td>${c}</td>` : `<th>${c}</th>`).join('')}</tr>`).join('')}</tbody></table></div>
    </div></section>`;
  }

  pages.loja = (q) => {
    const c = q.get('cat'), ord = q.get('ord') || 'destaque';
    let ps = L.produtos.filter(p => !c || p.cat === c);
    if (ord === 'menor') ps = [...ps].sort((a, b) => a.preco - b.preco);
    if (ord === 'maior') ps = [...ps].sort((a, b) => b.preco - a.preco);
    if (ord === 'az') ps = [...ps].sort((a, b) => a.nome.localeCompare(b.nome));
    const chip = (slug, nome) => `<a class="chip${(c || '') === slug ? ' on' : ''}" href="#/loja${slug ? '?cat=' + slug : ''}">${nome}</a>`;
    return `<section class="sec pg"><div class="wrap">
      ${crumbs({ t: 'Loja' })}
      <div class="sec-head rv"><h1 class="h2">${c ? esc(cat(c).nome) : 'Todas as peças'}</h1><p class="lead">Fabricação própria, tecido premium e compressão testada em treino de verdade.</p></div>
      <div class="filtros rv"><div class="chips">${chip('', 'Tudo')}${L.categorias.map(x => chip(x.slug, x.nome)).join('')}</div>
        <label class="ord"><span>${ps.length} peças</span><select id="ord"><option value="destaque"${ord === 'destaque' ? ' selected' : ''}>Em destaque</option><option value="menor"${ord === 'menor' ? ' selected' : ''}>Menor preço</option><option value="maior"${ord === 'maior' ? ' selected' : ''}>Maior preço</option><option value="az"${ord === 'az' ? ' selected' : ''}>A – Z</option></select></label></div>
      ${grid(ps)}
    </div></section>`;
  };

  pages.produto = (slug) => {
    const p = prod(slug); if (!p) return pages.nada();
    const parc = brl(p.preco / 6);
    const rel = L.produtos.filter(x => x.slug !== p.slug && x.cat === p.cat).concat(L.produtos.filter(x => x.slug !== p.slug && x.cat !== p.cat)).slice(0, 3);
    return `<section class="sec pg pdp"><div class="wrap">
      ${crumbs({ t: 'Loja', href: '#/loja' }, { t: cat(p.cat).nome, href: '#/loja?cat=' + p.cat }, { t: p.nome })}
      <div class="pdp-g">
        <div class="gal"><div class="gal-main"><img id="galMain" src="${p.imgs[0]}" alt="${esc(p.nome)}" width="900" height="1200"></div>
          ${p.imgs.length > 1 ? `<div class="gal-t">${p.imgs.map((s, i) => `<button data-img="${s}" class="${i ? '' : 'on'}"><img src="${s}" alt="" width="120" height="160" loading="lazy"></button>`).join('')}</div>` : ''}</div>
        <div class="info">
          <p class="eyebrow">${esc(cat(p.cat).nome)}</p><h1 class="h2">${esc(p.nome)}</h1>
          <p class="preco">${brl(p.preco)}${p.precoDe ? ` <s>${brl(p.precoDe)}</s>` : ''}<small>ou 6x de ${parc} sem juros</small></p>
          <p class="desc">${esc(p.desc)}</p>
          <div class="opt"><span class="lbl">Cor: <b id="corNome">${esc(L.cores[p.cores[0]].nome)}</b></span><div class="cores">${p.cores.map((k, i) => `<button class="cor${i ? '' : ' on'}" data-cor="${k}" title="${esc(L.cores[k].nome)}"><i style="background:${L.cores[k].sw}"></i></button>`).join('')}</div></div>
          <div class="opt"><span class="lbl">Tamanho <a href="#/sobre?ir=provador" class="link">Guia de medidas</a></span><div class="tams">${L.tamanhos.map(t => `<button class="tam${t === 'M' ? ' on' : ''}" data-tam="${t}">${t}</button>`).join('')}</div></div>
          <div class="opt"><span class="lbl">Quantidade</span><div class="qt big"><button id="qm" aria-label="Diminuir">−</button><span id="qv">1</span><button id="qp" aria-label="Aumentar">+</button></div></div>
          <div class="acts"><button class="btn" id="add">Adicionar à sacola</button>${btnWA('Tirar dúvida', 'btn ghost')}</div>
          <p class="nota">Pagamento online em breve. A sacola já monta o seu pedido e envia direto no WhatsApp da loja.</p>
          <ul class="bene"><li>Frete grátis acima de ${brl(L.freteGratis)}</li><li>Troca em 30 dias</li><li>Envio em 48h úteis</li></ul>
          <details open><summary>Tecido e composição</summary><p>${esc(p.tecido)}. Toque seco, proteção UV e opacidade testada no agachamento. Costura overloque reforçada e etiqueta impressa — sem atrito na pele.</p></details>
          <details><summary>Cuidados com a peça</summary><p>Lavar à mão ou no ciclo delicado com água fria, do avesso. Não usar amaciante nem secadora. Secar à sombra.</p></details>
          <details><summary>Entrega e devolução</summary><p>Envio em até 48h úteis para todo o Brasil. Você tem 30 dias corridos para trocar ou devolver uma peça sem uso e com etiqueta.</p></details>
          ${p.real ? '' : '<p class="nota demo">Foto ilustrativa gerada para a demonstração — será substituída pela foto real da peça.</p>'}
        </div></div>
      <div class="sec-head row" style="margin-top:var(--sec)"><div><p class="eyebrow">Complete o look</p><h2>Combina <em>com</em></h2></div><a class="link" href="#/loja">Ver tudo</a></div>
      ${grid(rel)}
    </div></section>`;
  };

  pages.sobre = () => `<section class="sec pg"><div class="wrap">
    ${crumbs({ t: 'A marca' })}
    <div class="split"><div class="rv"><p class="eyebrow">A marca</p><h1 class="h2">Amigas que treinam. <em>Peças que acompanham.</em></h1>
      <p class="lead">A Amicis nasceu em Goiânia, entre corridas de domingo e treinos de 6h da manhã. Fabricamos cada peça na nossa própria confecção — por isso o caimento é igual em todas, e por isso cada modelo tem nome de mulher.</p>
      <p class="lead">Tecido premium, compressão perfeita, varejo e atacado. Loja exclusivamente online, atendimento direto no WhatsApp.</p></div>
      <div class="rv"><img src="assets/img/colecao-harmony.jpg" width="1080" height="1350" loading="lazy" alt="Coleção HARMONY"></div></div>
  </div></section>${provador()}`;

  pages.atacado = () => `<section class="sec pg"><div class="wrap">
    ${crumbs({ t: 'Atacado' })}
    <div class="sec-head rv"><p class="eyebrow">Club Amicis</p><h1 class="h2">Revenda com preço <em>de fábrica.</em></h1>
      <p class="lead">Somos fábrica, não distribuidora. Você compra a mesma peça do varejo, com a mesma etiqueta e o mesmo tecido — pagando preço de produção.</p></div>
    <div class="rv tbl"><table><thead><tr><th>Volume do pedido</th><th>Formato da grade</th><th>Condição</th></tr></thead><tbody>
      <tr><th>12 a 35 peças</th><td>Grade sortida</td><td>−30% sobre o varejo</td></tr>
      <tr><th>36 a 99 peças</th><td>Grade fechada ou sortida</td><td>−40% sobre o varejo</td></tr>
      <tr><th>100+ peças</th><td>Grade fechada</td><td>Tabela negociada</td></tr></tbody></table>
      <small class="nota">Valores de referência · a tabela oficial é enviada junto com o catálogo.</small></div>
    <div class="split" style="margin-top:var(--sec)">
      <div class="rv"><p class="eyebrow">Como funciona</p><div class="list">
        <div><b>Pedido mínimo de ${L.atacadoMinimo} peças</b><span>Podendo misturar modelos.</span></div>
        <div><b>Catálogo com fotos em alta</b><span>E tabela de preço por WhatsApp.</span></div>
        <div><b>Pix, boleto ou cartão em até 6x</b><span></span></div>
        <div><b>Produção e envio em até 10 dias úteis</b><span>Para todo o Brasil.</span></div>
        <div><b>Etiqueta neutra ou personalizada</b><span>Sob consulta.</span></div></div></div>
      <form class="form rv" id="fAtacado"><p class="eyebrow">Solicite o catálogo</p><h2 class="h3">Conte um pouco sobre a sua loja</h2>
        <label>Nome<input name="nome" required></label><label>Loja / CNPJ<input name="loja"></label><label>WhatsApp<input name="zap" required></label><label>Cidade / UF<input name="cidade"></label>
        <label>O que você procura<textarea name="msg" rows="3"></textarea></label>
        <button class="btn" type="submit">Enviar solicitação</button><p class="nota">Abre a conversa no WhatsApp com a solicitação pronta.</p></form></div>
  </div></section>`;

  pages.contato = () => `<section class="sec pg"><div class="wrap">
    ${crumbs({ t: 'Contato' })}
    <div class="sec-head rv"><h1 class="h2">Fale com <em>a Amicis.</em></h1><p class="lead">Dúvida de tamanho, status do pedido, troca ou atacado — estamos por aqui de segunda a sexta, das 9h às 18h.</p></div>
    <div class="split"><div class="rv"><p class="eyebrow">Canais</p><div class="list">
        <div><b><a href="${L.whatsLink}" target="_blank" rel="noopener">WhatsApp da loja</a></b><span>Atendimento direto</span></div>
        <div><b><a href="${L.instagram}" target="_blank" rel="noopener">@amicisfitness</a></b><span>Novidades e bastidores</span></div>
        <div><b>Goiânia · GO</b><span>Atendimento online, envio para todo o Brasil</span></div></div>
      <p class="eyebrow" style="margin-top:32px">Trocas e devoluções</p><p>Você tem 30 dias corridos a partir do recebimento para trocar ou devolver uma peça sem uso e com a etiqueta. A primeira troca por tamanho tem frete por nossa conta.</p></div>
      <form class="form rv" id="fContato"><p class="eyebrow">Mande uma mensagem</p>
        <label>Nome<input name="nome" required></label><label>Assunto<input name="assunto" placeholder="Pedido, troca, tamanho…"></label><label>Mensagem<textarea name="msg" rows="4" required></textarea></label>
        <button class="btn" type="submit">Enviar pelo WhatsApp</button></form></div>
  </div></section>`;

  pages.nada = () => `<section class="sec pg"><div class="wrap"><h1 class="h2">Página não encontrada.</h1><p><a class="link" href="#/">Voltar ao início</a></p></div></section>`;

  /* ---------- router ---------- */
  function rota() {
    const h = location.hash.replace(/^#\/?/, '') || '';
    const [path, qs] = h.split('?'); const q = new URLSearchParams(qs || '');
    const seg = path.split('/').filter(Boolean);
    let html, title = L.marca;
    if (!seg.length) html = pages.home();
    else if (seg[0] === 'loja') { html = pages.loja(q); title = 'Loja · ' + title; }
    else if (seg[0] === 'produto') { const p = prod(seg[1]); html = pages.produto(seg[1]); title = (p ? p.nome : 'Produto') + ' · ' + title; }
    else if (pages[seg[0]]) { html = pages[seg[0]](q); title = { sobre: 'A marca', atacado: 'Atacado', contato: 'Contato' }[seg[0]] + ' · ' + title; }
    else html = pages.nada();
    app.innerHTML = html; document.title = title;
    document.body.classList.toggle('home', !seg.length);
    fecharSacola(); montar(seg, q);
    const alvo = q.get('ir') && document.getElementById(q.get('ir'));
    if (alvo) alvo.scrollIntoView({ behavior: 'smooth' }); else window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelectorAll('.rv').forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); io.observe(el); } });
  }

  function montar(seg, q) {
    const ord = $('#ord'); if (ord) ord.onchange = () => { const p = new URLSearchParams(location.hash.split('?')[1] || ''); p.set('ord', ord.value); location.hash = '#/loja?' + p; };
    if (seg[0] === 'produto') {
      const p = prod(seg[1]); if (!p) return;
      let cor = p.cores[0], tam = 'M', qtd = 1;
      document.querySelectorAll('.cor').forEach(b => b.onclick = () => { cor = b.dataset.cor; document.querySelectorAll('.cor').forEach(x => x.classList.toggle('on', x === b)); $('#corNome').textContent = L.cores[cor].nome; });
      document.querySelectorAll('.tam').forEach(b => b.onclick = () => { tam = b.dataset.tam; document.querySelectorAll('.tam').forEach(x => x.classList.toggle('on', x === b)); });
      $('#qm').onclick = () => { qtd = Math.max(1, qtd - 1); $('#qv').textContent = qtd; };
      $('#qp').onclick = () => { qtd = Math.min(10, qtd + 1); $('#qv').textContent = qtd; };
      $('#add').onclick = () => addSacola(p.slug, cor, tam, qtd);
      document.querySelectorAll('.gal-t button').forEach(b => b.onclick = () => { $('#galMain').src = b.dataset.img; document.querySelectorAll('.gal-t button').forEach(x => x.classList.toggle('on', x === b)); });
    }
    const fa = $('#fAtacado'); if (fa) fa.onsubmit = e => { e.preventDefault(); const d = new FormData(fa); enviarWA(`Olá, Amicis! Quero o catálogo de atacado.\nNome: ${d.get('nome')}\nLoja/CNPJ: ${d.get('loja')}\nWhatsApp: ${d.get('zap')}\nCidade/UF: ${d.get('cidade')}\nProcuro: ${d.get('msg')}`); };
    const fc = $('#fContato'); if (fc) fc.onsubmit = e => { e.preventDefault(); const d = new FormData(fc); enviarWA(`Olá, Amicis! Sou ${d.get('nome')}.\nAssunto: ${d.get('assunto')}\n${d.get('msg')}`); };
    tocarVideos();
  }
  /* iOS/WebKit: vídeo criado via innerHTML pode perder o muted → autoplay recusado → botão de play.
     Força as propriedades, tenta tocar, e usa o primeiro gesto do usuário como destrava (Modo Pouca Energia). */
  function tocarVideos() {
    document.querySelectorAll('video').forEach(v => {
      v.muted = true; v.defaultMuted = true; v.playsInline = true; v.loop = true; v.autoplay = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.removeAttribute('controls');
      const p = v.play(); if (p && p.catch) p.catch(() => { });
    });
  }
  ['touchstart', 'touchend', 'scroll', 'click'].forEach(ev => addEventListener(ev, tocarVideos, { passive: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tocarVideos(); });
  function enviarWA(msg) { abrirWA(msg); }

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });

  /* ---------- eventos globais ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-q],[data-rm],[data-fecha],#abrirSacola,#fecharSacola,#veu,#checkout,#menuBtn');
    if (!t) return;
    if (t.dataset.q) { const [i, d] = t.dataset.q.split(':').map(Number); mudarQtd(i, d); }
    else if (t.dataset.rm !== undefined) { sacola.splice(+t.dataset.rm, 1); salvar(); renderSacola(); }
    else if (t.id === 'abrirSacola') abrirSacola();
    else if (t.id === 'checkout') checkout();
    else if (t.id === 'menuBtn') document.body.classList.toggle('menu');
    else fecharSacola();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { fecharSacola(); document.body.classList.remove('menu'); } });
  addEventListener('hashchange', () => { document.body.classList.remove('menu'); rota(); });
  addEventListener('scroll', () => $('#hdr').classList.toggle('on', scrollY > 24), { passive: true });
  renderSacola(); rota();
})();
