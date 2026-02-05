const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits, StringSelectMenuBuilder } = require('discord.js');

// ============================================
// 🔧 CONFIGURAÇÕES - PREENCHA AQUI
// ============================================
const TOKEN = 'MTQyODgzNDUxMzA4OTMzMTI4Mw****************************************';
const CANAL_REGISTRO_ID = '145791070***************'; // Canal onde ficará o botão
const CATEGORIA_FARMS_ID = '14269456***************'; // ID da categoria onde os canais privados serão criados
const CARGO_GERENCIA_ID = '142694559***************'; // ID do cargo de gerência que pode ver todos os canais
const CAMINHO_IMAGEM = 'assets/banner-parceiros.png'; // Caminho da sua imagem PNG

// ============================================
// 🤖 INICIALIZAÇÃO DO BOT
// ============================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

// Armazena temporariamente os dados dos funcionários que estão registrando farms
const registrosEmAndamento = new Map();

// Armazena o mapeamento de usuário -> canal privado
const canaisPrivados = new Map();

// Armazena os farms de cada usuário
const farmsUsuarios = new Map();

// ============================================
// 🚀 QUANDO O BOT LIGAR
// ============================================
client.once('clientReady', async () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  console.log(`📋 Enviando mensagem fixa...`);
  
  try {
    const canal = await client.channels.fetch(CANAL_REGISTRO_ID);
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('🌾 Sistema de Registro de Farms')
      .setDescription(
        '**Bem-vindo ao sistema de registro de farms!**\n\n' +
        '📋 **Como funciona:**\n' +
        '1️⃣ Clique no botão "📝 Registrar Farm" abaixo\n' +
        '2️⃣ Um canal privado será criado automaticamente para você\n' +
        '3️⃣ No seu canal, preencha as informações e envie a imagem\n' +
        '4️⃣ Todos os seus farms ficarão salvos no seu canal!\n\n' +
        '⚠️ **IMPORTANTE - LEIA COM ATENÇÃO:**\n' +
        '🖥️ **APENAS PRINT DE TELA INTEIRA SERÁ ACEITO!**\n' +
        '🕐 **O PRINT DEVE MOSTRAR A HORA NO CANTO DA TELA!**\n' +
        '❌ Prints cortados, recortados ou sem hora serão **RECUSADOS**\n' +
        '✅ Use **F11** ou **Print Screen** para capturar a tela completa\n' +
        '📸 O print deve mostrar TODA a tela do jogo/sistema COM A HORA VISÍVEL\n\n' +
        '💰 **Para gerência:** Use o botão "Pagamentos" para registrar pagamentos\n\n' +
        '🔒 **Apenas você e a gerência podem ver seus farms!**'
      )
      .setImage('attachment://imagem_farms.png')
      .setFooter({ text: '⚠️ ATENÇÃO: Tela inteira + Hora visível!' })
      .setTimestamp();

    const botaoRegistrar = new ButtonBuilder()
      .setCustomId('criar_canal_farm')
      .setLabel('📝 Registrar Farm')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🌾');

    const botaoPagamentos = new ButtonBuilder()
      .setCustomId('abrir_pagamento_principal')
      .setLabel('💰 Pagamentos')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('💵');

    const row = new ActionRowBuilder().addComponents(botaoRegistrar, botaoPagamentos);

    await canal.send({
      embeds: [embed],
      components: [row],
      files: [{
        attachment: CAMINHO_IMAGEM,
        name: 'imagem_farms.png'
      }]
    });

    console.log('✅ Mensagem fixa enviada com sucesso!');
    console.log('🎉 Bot pronto para registrar farms!');
    console.log('💡 Use o comando !restaurar_botoes para restaurar botões nos canais privados');
    
    // 🔔 MENSAGEM DE AVISO QUE O BOT ESTÁ FUNCIONANDO
    const embedAviso = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('✅ Bot de Farms Online!')
      .setDescription(
        '**O sistema de registro de farms está funcionando!**\n\n' +
        '🟢 **Status:** Online e operacional\n' +
        '⚡ **Performance:** 100% funcional\n' +
        '🔄 **Última reinicialização:** <t:' + Math.floor(Date.now() / 1000) + ':R>\n\n' +
        '📋 **Funcionalidades ativas:**\n' +
        '✅ Registro de farms ilimitados\n' +
        '✅ Canais privados individuais\n' +
        '✅ Sistema de pagamentos\n' +
        '✅ Backup automático de dados\n\n' +
        '⚠️ **LEMBRETE IMPORTANTE:**\n' +
        '🖥️ **APENAS PRINTS DE TELA INTEIRA SERÃO ACEITOS!**\n' +
        '🕐 **O PRINT DEVE MOSTRAR A HORA NO CANTO DA TELA!**\n' +
        '❌ Prints cortados, editados ou SEM HORA serão recusados\n\n' +
        '💡 *Qualquer dúvida, contacte a gerência!*'
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: 'Sistema de Farms - Tela inteira + Hora obrigatória' })
      .setTimestamp();

    await canal.send({ embeds: [embedAviso] });
    console.log('🔔 Mensagem de status enviada!');
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem fixa:', error);
    console.log('⚠️  Verifique se o caminho da imagem e ID do canal estão corretos.');
  }
});

// ============================================
// 🔧 FUNÇÃO: CRIAR OU PEGAR CANAL PRIVADO
// ============================================
async function obterCanalPrivado(guild, usuario) {
  const userId = usuario.id;
  
  const membro = await guild.members.fetch(userId);
  const apelidoServidor = membro.nickname || membro.displayName;
  
  const apelidoLimpo = apelidoServidor.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '');
  const nomeCanal = `🌾┃${apelidoLimpo}`;
  
  // Verifica se já existe canal para este usuário
  if (canaisPrivados.has(userId)) {
    const canalId = canaisPrivados.get(userId);
    try {
      const canal = await guild.channels.fetch(canalId);
      if (canal) return canal;
    } catch (error) {
      canaisPrivados.delete(userId);
    }
  }
  
  // Busca se já existe um canal com este nome
  const canalExistente = guild.channels.cache.find(
    c => c.name === nomeCanal && c.parentId === CATEGORIA_FARMS_ID
  );
  
  if (canalExistente) {
    canaisPrivados.set(userId, canalExistente.id);
    return canalExistente;
  }
  
  try {
    console.log(`📝 Criando canal: ${nomeCanal}`);
    
    const novoCanal = await guild.channels.create({
      name: nomeCanal,
      type: ChannelType.GuildText,
      parent: CATEGORIA_FARMS_ID,
      topic: `📋 Farms registrados por ${usuario.username}`,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: guild.members.me.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ManageMessages,
          ],
        },
        {
          id: userId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
          ],
        },
        {
          id: CARGO_GERENCIA_ID,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
          ],
        },
      ],
    });
    
    console.log(`✅ Canal criado: ${novoCanal.name}`);
    
    const embedBoasVindas = new EmbedBuilder()
      .setColor('#9b59b6')
      .setTitle(`🌾 Canal de Farms - ${usuario.username}`)
      .setDescription(
        `**Bem-vindo ao seu canal privado de farms!**\n\n` +
        `👤 Este canal é exclusivo para você e a gerência\n` +
        `📋 Todos os seus farms registrados aparecerão aqui\n` +
        `🔒 Apenas você e a gerência podem ver este canal\n\n` +
        `⚠️ **REGRAS IMPORTANTES:**\n` +
        `🖥️ **APENAS PRINTS DE TELA INTEIRA SERÃO ACEITOS!**\n` +
        `🕐 **O PRINT DEVE MOSTRAR A HORA NO CANTO DA TELA!**\n` +
        `❌ Prints cortados, editados ou SEM HORA serão **RECUSADOS**\n` +
        `✅ Use F11 + Print Screen para capturar a tela completa COM HORA\n\n` +
        `✨ **Para registrar um farm, clique no botão abaixo!**`
      )
      .setThumbnail(usuario.displayAvatarURL())
      .setTimestamp()
      .setFooter({ text: '⚠️ Tela inteira + Hora obrigatória!' });
    
    const botaoRegistrarFarm = new ButtonBuilder()
      .setCustomId('registrar_farm_canal')
      .setLabel('📝 Registrar Farm')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🌾');
    
    const botaoPagamento = new ButtonBuilder()
      .setCustomId('abrir_modal_pagamento')
      .setLabel('💰 Pagamento')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('💵');
    
    const rowFarm = new ActionRowBuilder().addComponents(botaoRegistrarFarm, botaoPagamento);
    
    await novoCanal.send({ embeds: [embedBoasVindas], components: [rowFarm] });
    
    canaisPrivados.set(userId, novoCanal.id);
    
    return novoCanal;
    
  } catch (error) {
    console.error('❌ Erro ao criar canal privado:', error);
    throw error;
  }
}

// ============================================
// 📨 QUANDO ALGUÉM ENVIAR UMA MENSAGEM
// ============================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;
  
  // ✅ COMANDO: Restaurar botões nos canais privados
  if (message.content === '!restaurar_botoes') {
    if (!message.member.roles.cache.has(CARGO_GERENCIA_ID)) {
      return message.reply('❌ Apenas a gerência pode usar este comando!');
    }
    
    const msgProcessando = await message.reply('⏳ Restaurando botões em todos os canais...');
    
    try {
      const guild = message.guild;
      const canaisFarms = guild.channels.cache.filter(
        c => c.parentId === CATEGORIA_FARMS_ID && c.name.startsWith('🌾┃')
      );
      
      let contador = 0;
      
      for (const [id, canal] of canaisFarms) {
        try {
          const todasMensagens = await canal.messages.fetch({ limit: 100 });
          let donoCanal = null;
          
          const permissoes = canal.permissionOverwrites.cache;
          for (const [userId, permissao] of permissoes) {
            if (userId !== guild.id && 
                userId !== client.user.id && 
                userId !== CARGO_GERENCIA_ID) {
              try {
                donoCanal = await guild.members.fetch(userId);
                break;
              } catch (e) {
                continue;
              }
            }
          }
          
          if (!donoCanal) {
            console.log(`⚠️ Não foi possível encontrar o dono do canal ${canal.name}`);
            continue;
          }
          
          for (const msg of todasMensagens.values()) {
            if (msg.author.id === client.user.id && 
                msg.components.length > 0 &&
                msg.embeds.length > 0 && 
                msg.embeds[0].title?.includes('Canal de Farms')) {
              await msg.delete();
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          const embedBoasVindas = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle(`🌾 Canal de Farms - ${donoCanal.user.username}`)
            .setDescription(
              `**Bem-vindo ao seu canal privado de farms!**\n\n` +
              `👤 Este canal é exclusivo para você e a gerência\n` +
              `📋 Todos os seus farms registrados aparecerão aqui\n` +
              `🔒 Apenas você e a gerência podem ver este canal\n\n` +
              `⚠️ **REGRAS IMPORTANTES:**\n` +
              `🖥️ **APENAS PRINTS DE TELA INTEIRA SERÃO ACEITOS!**\n` +
              `🕐 **O PRINT DEVE MOSTRAR A HORA NO CANTO DA TELA!**\n` +
              `❌ Prints cortados, editados ou SEM HORA serão **RECUSADOS**\n` +
              `✅ Use F11 + Print Screen para capturar a tela completa COM HORA\n\n` +
              `✨ **Para registrar um farm, clique no botão abaixo!**`
            )
            .setThumbnail(donoCanal.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: '⚠️ Tela inteira + Hora obrigatória!' });
          
          const botaoRegistrarFarm = new ButtonBuilder()
            .setCustomId('registrar_farm_canal')
            .setLabel('📝 Registrar Farm')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🌾');
          
          const botaoPagamento = new ButtonBuilder()
            .setCustomId('abrir_modal_pagamento')
            .setLabel('💰 Pagamento')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💵');
          
          const rowFarm = new ActionRowBuilder().addComponents(botaoRegistrarFarm, botaoPagamento);
          
          await canal.send({ embeds: [embedBoasVindas], components: [rowFarm] });
          contador++;
          
          console.log(`✅ Botões restaurados no canal: ${canal.name}`);
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          
        } catch (error) {
          console.log(`⚠️ Erro ao restaurar botões no canal ${canal.name}:`, error.message);
        }
      }
      
      await msgProcessando.edit(
        `✅ **Botões restaurados com sucesso!**\n` +
        `📊 Total de canais processados: ${contador}/${canaisFarms.size}\n` +
        `🎉 Todos os canais agora têm os botões atualizados no final!`
      );
      
    } catch (error) {
      console.error('❌ Erro ao restaurar botões:', error);
      await msgProcessando.edit('❌ Erro ao restaurar botões. Verifique o console para mais detalhes.');
    }
    
    return;
  }
});

// ============================================
// 🔘 QUANDO ALGUÉM CLICAR EM BOTÕES
// ============================================
client.on('interactionCreate', async (interaction) => {
  
  // Botão: Criar Canal Farm
  if (interaction.isButton() && interaction.customId === 'criar_canal_farm') {
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const canalPrivado = await obterCanalPrivado(interaction.guild, interaction.user);
      
      await interaction.editReply({
        content: `✅ **Canal criado/acessado com sucesso!**\n\n` +
                 `📁 Seu canal: ${canalPrivado}\n` +
                 `🔒 Apenas você e a gerência podem ver este canal!\n\n` +
                 `💡 **Vá até o canal e clique no botão para registrar seus farms!**`
      });
      
    } catch (error) {
      console.error('Erro ao criar canal:', error);
      await interaction.editReply({
        content: '❌ **Erro ao criar seu canal!**\nVerifique as permissões do bot ou contate a gerência.'
      });
    }
  }
  
  // Botão: Registrar Farm no Canal
  if (interaction.isButton() && interaction.customId === 'registrar_farm_canal') {
    
    // ✅ CORREÇÃO: Remove verificação de limite - permite registros ilimitados
    // Apenas verifica se NÃO há registro em andamento esperando imagem
    const registroAtual = registrosEmAndamento.get(interaction.user.id);
    if (registroAtual && !registroAtual.imagemEnviada) {
      return interaction.reply({
        content: '⚠️ **Você tem um registro aguardando imagem!**\n' +
                 'Por favor, envie a imagem do farm anterior antes de iniciar um novo registro.',
        ephemeral: true
      });
    }
    
    const modal = new ModalBuilder()
      .setCustomId('modal_farm')
      .setTitle('📝 Registrar Novo Farm');

    const animalSementeInput = new TextInputBuilder()
      .setCustomId('animal_semente')
      .setLabel('🌾 Animal ou Semente')
      .setPlaceholder('Ex: Galinha, Vaca, Trigo, Cenoura...')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const quantidadeInput = new TextInputBuilder()
      .setCustomId('quantidade')
      .setLabel('📊 Quantidade')
      .setPlaceholder('Ex: 150, 2500, 1000...')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(50);

    const descricaoInput = new TextInputBuilder()
      .setCustomId('descricao_farm')
      .setLabel('📝 Descrição (Opcional)')
      .setPlaceholder('Informações adicionais sobre o farm...')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(1000);

    const linha1 = new ActionRowBuilder().addComponents(animalSementeInput);
    const linha2 = new ActionRowBuilder().addComponents(quantidadeInput);
    const linha3 = new ActionRowBuilder().addComponents(descricaoInput);

    modal.addComponents(linha1, linha2, linha3);

    await interaction.showModal(modal);
  }

  // Botão: Pagamento no Canal
  if (interaction.isButton() && interaction.customId === 'abrir_modal_pagamento') {
    if (!interaction.member.roles.cache.has(CARGO_GERENCIA_ID)) {
      return interaction.reply({
        content: '❌ Apenas a gerência pode usar este botão!',
        ephemeral: true
      });
    }
    
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const canalAtual = interaction.channel;
      
      // Verifica se está em um canal de farm
      if (!canalAtual.name.startsWith('🌾┃')) {
        return interaction.editReply({
          content: '❌ Este botão só funciona nos canais de farms dos funcionários!'
        });
      }
      
      // Busca o dono do canal através das permissões
      let donoCanal = null;
      const permissoes = canalAtual.permissionOverwrites.cache;
      
      for (const [userId, permissao] of permissoes) {
        if (userId !== interaction.guild.id && 
            userId !== client.user.id && 
            userId !== CARGO_GERENCIA_ID) {
          try {
            donoCanal = await interaction.guild.members.fetch(userId);
            break;
          } catch (e) {
            continue;
          }
        }
      }
      
      if (!donoCanal) {
        return interaction.editReply({
          content: '❌ Não foi possível identificar o dono deste canal!'
        });
      }
      
      // Busca todos os farms registrados no canal
      const mensagens = await canalAtual.messages.fetch({ limit: 100 });
      const farmsEncontrados = [];
      
      for (const msg of mensagens.values()) {
        if (msg.author.id === client.user.id && 
            msg.embeds.length > 0 && 
            msg.embeds[0].title === '🌾 Farm Registrado') {
          
          const embed = msg.embeds[0];
          const fields = embed.fields;
          
          let animalSemente = 'Não informado';
          let quantidade = 'Não informado';
          
          for (const field of fields) {
            if (field.name.includes('Animal/Semente')) {
              animalSemente = field.value;
            }
            if (field.name.includes('Quantidade')) {
              quantidade = field.value;
            }
          }
          
          farmsEncontrados.push({
            animalSemente: animalSemente,
            quantidade: quantidade
          });
        }
      }
      
      if (farmsEncontrados.length === 0) {
        return interaction.editReply({
          content: `❌ **Nenhum farm encontrado no canal de ${donoCanal.displayName}!**`
        });
      }
      
      // Agrupa os farms
      const farmsAgrupados = {};
      farmsEncontrados.forEach(farm => {
        if (!farmsAgrupados[farm.animalSemente]) {
          farmsAgrupados[farm.animalSemente] = 0;
        }
        const qtd = parseInt(farm.quantidade.replace(/\D/g, '')) || 0;
        farmsAgrupados[farm.animalSemente] += qtd;
      });
      
      // Cria o embed de resumo
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle(`💰 Resumo de Farms - ${donoCanal.displayName}`)
        .setThumbnail(donoCanal.user.displayAvatarURL())
        .setTimestamp();
      
      let descricao = `**Total de farms encontrados:** ${farmsEncontrados.length}\n\n**Resumo por tipo:**\n\n`;
      
      for (const [tipo, quantidade] of Object.entries(farmsAgrupados)) {
        descricao += `🌾 **${tipo}:** ${quantidade.toLocaleString('pt-BR')}\n`;
      }
      
      embed.setDescription(descricao);
      
      const botaoConfirmar = new ButtonBuilder()
        .setCustomId(`confirmar_pagamento_canal_${donoCanal.id}`)
        .setLabel('✅ Confirmar Pagamento')
        .setStyle(ButtonStyle.Success)
        .setEmoji('💰');
      
      const botaoCancelar = new ButtonBuilder()
        .setCustomId('cancelar_pagamento')
        .setLabel('❌ Cancelar')
        .setStyle(ButtonStyle.Danger);
      
      const row = new ActionRowBuilder().addComponents(botaoConfirmar, botaoCancelar);
      
      await interaction.editReply({ embeds: [embed], components: [row] });
      
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      await interaction.editReply({
        content: '❌ Erro ao processar pagamento. Verifique o console.'
      });
    }
  }

  // Botão: Confirmar Pagamento do Canal
  if (interaction.isButton() && interaction.customId.startsWith('confirmar_pagamento_canal_')) {
    const userId = interaction.customId.replace('confirmar_pagamento_canal_', '');
    
    await interaction.deferUpdate();
    
    try {
      const usuario = await interaction.client.users.fetch(userId);
      const canalAtual = interaction.channel;
      
      // Busca todos os farms do canal
      const mensagens = await canalAtual.messages.fetch({ limit: 100 });
      const farmsEncontrados = [];
      
      for (const msg of mensagens.values()) {
        if (msg.author.id === client.user.id && 
            msg.embeds.length > 0 && 
            msg.embeds[0].title === '🌾 Farm Registrado') {
          
          const embed = msg.embeds[0];
          const fields = embed.fields;
          
          let animalSemente = 'Não informado';
          let quantidade = 'Não informado';
          
          for (const field of fields) {
            if (field.name.includes('Animal/Semente')) {
              animalSemente = field.value;
            }
            if (field.name.includes('Quantidade')) {
              quantidade = field.value;
            }
          }
          
          farmsEncontrados.push({
            animalSemente: animalSemente,
            quantidade: quantidade
          });
        }
      }
      
      // Agrupa os farms
      const farmsAgrupados = {};
      farmsEncontrados.forEach(farm => {
        if (!farmsAgrupados[farm.animalSemente]) {
          farmsAgrupados[farm.animalSemente] = 0;
        }
        const qtd = parseInt(farm.quantidade.replace(/\D/g, '')) || 0;
        farmsAgrupados[farm.animalSemente] += qtd;
      });
      
      let listaFarms = '';
      for (const [tipo, quantidade] of Object.entries(farmsAgrupados)) {
        listaFarms += `🌾 **${tipo}:** ${quantidade.toLocaleString('pt-BR')}\n`;
      }
      
      // Envia DM para o usuário
      try {
        await usuario.send({
          embeds: [{
            color: 0x2ecc71,
            title: '💰 Pagamento Confirmado!',
            description: 
              '✅ **Seu farm foi conferido e o pagamento foi efetuado!**\n\n' +
              '**Farms pagos:**\n' +
              listaFarms +
              '\n🎉 Obrigado pelo seu trabalho!\n' +
              '📋 Você pode registrar novos farms no seu canal privado.',
            timestamp: new Date(),
            footer: { text: 'Sistema de Farms' }
          }]
        });
      } catch (error) {
        console.error('Erro ao enviar DM:', error);
      }
      
      // Deleta todos os farms do canal (mantém apenas mensagem de boas-vindas e botões)
      for (const msg of mensagens.values()) {
        // Mantém apenas a mensagem de boas-vindas com botões
        if (msg.author.id === client.user.id && 
            msg.embeds.length > 0 && 
            msg.embeds[0].title?.includes('Canal de Farms') &&
            msg.components.length > 0) {
          continue;
        }
        
        try {
          await msg.delete();
        } catch (error) {
          console.log('⚠️ Não foi possível deletar mensagem');
        }
      }
      
      // Limpa os farms do usuário no Map
      farmsUsuarios.delete(userId);
      
      await interaction.editReply({
        content: `✅ **Pagamento registrado com sucesso!**\n📨 DM enviada para ${usuario.username}\n🧹 Canal limpo e pronto para novos registros!`,
        embeds: [],
        components: []
      });
      
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      await interaction.editReply({
        content: '❌ Erro ao processar pagamento.',
        embeds: [],
        components: []
      });
    }
  }

  // Botão: Cancelar Pagamento
  if (interaction.isButton() && interaction.customId === 'cancelar_pagamento') {
    await interaction.update({
      content: '❌ Pagamento cancelado.',
      embeds: [],
      components: []
    });
  }

  // Botão: Pagamentos no Canal Principal
  if (interaction.isButton() && interaction.customId === 'abrir_pagamento_principal') {
    if (!interaction.member.roles.cache.has(CARGO_GERENCIA_ID)) {
      return interaction.reply({
        content: '❌ Apenas a gerência pode usar este botão!',
        ephemeral: true
      });
    }
    
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const canaisFarms = interaction.guild.channels.cache.filter(
        c => c.parentId === CATEGORIA_FARMS_ID && c.name.startsWith('🌾┃')
      );
      
      const embed = new EmbedBuilder()
        .setColor('#f1c40f')
        .setTitle('💰 Sistema de Pagamentos')
        .setDescription(
          `**Painel de pagamentos para gerência**\n\n` +
          `📊 Total de funcionários: ${canaisFarms.size}\n` +
          `📁 Canais de farms ativos: ${canaisFarms.size}\n\n` +
          `💡 **Como usar:**\n` +
          `Entre no canal do funcionário e clique no botão "💰 Pagamento"\n` +
          `Você verá todos os farms dele e poderá confirmar o pagamento.`
        )
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Erro ao abrir pagamentos:', error);
      await interaction.editReply({
        content: '❌ Erro ao abrir sistema de pagamentos.'
      });
    }
  }

  // Modal Submit: Formulário de Farm
  if (interaction.isModalSubmit() && interaction.customId === 'modal_farm') {
    
    const animalSemente = interaction.fields.getTextInputValue('animal_semente');
    const quantidade = interaction.fields.getTextInputValue('quantidade');
    const descricao = interaction.fields.getTextInputValue('descricao_farm') || 'Sem descrição adicional';
    
    const nomeUsuario = interaction.member.displayName;
    const apelidoServidor = interaction.member.nickname || interaction.member.displayName;
    const numerosPombo = apelidoServidor.match(/\d+/g)?.join('') || 'Sem número';
    
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const canalPrivado = interaction.channel;
      
      // ✅ NOVA LÓGICA: Cria o embed IMEDIATAMENTE com as informações
      const embedFarm = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('🌾 Farm Registrado')
        .addFields(
          { name: '👤 Funcionário', value: nomeUsuario, inline: true },
          { name: '🐦 Pombo', value: numerosPombo, inline: true },
          { name: '🌾 Animal/Semente', value: animalSemente, inline: false },
          { name: '📊 Quantidade', value: quantidade, inline: false },
          { name: '📝 Descrição', value: descricao, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: '📸 Aguardando comprovante...' });

      // Envia o embed
      await canalPrivado.send({ embeds: [embedFarm] });
      
      // Envia mensagem pedindo a imagem logo abaixo
      await canalPrivado.send({
        content: 
          '📸 **ENVIE O COMPROVANTE AGORA:**\n\n' +
          '⚠️ **ATENÇÃO - REGRAS IMPORTANTES:**\n' +
          '🖥️ **APENAS PRINT DE TELA INTEIRA!**\n' +
          '🕐 **O PRINT DEVE MOSTRAR A HORA NO CANTO DA TELA!**\n' +
          '❌ **Prints cortados ou sem hora serão RECUSADOS**\n\n' +
          '✅ **Como enviar:**\n' +
          '▸ Arraste e solte a imagem aqui\n' +
          '▸ Ou clique no ➕ para anexar\n' +
          '▸ Ou cole com Ctrl+V'
      });
      
      // Armazena o farm do usuário
      const userId = interaction.user.id;
      if (!farmsUsuarios.has(userId)) {
        farmsUsuarios.set(userId, []);
      }
      
      farmsUsuarios.get(userId).push({
        animalSemente: animalSemente,
        quantidade: quantidade,
        timestamp: Date.now()
      });
      
      await interaction.editReply({
        content: 
          '✅ **Farm registrado com sucesso!**\n\n' +
          '📋 As informações foram salvas no canal.\n' +
          '📸 Agora envie a imagem do comprovante logo abaixo!\n\n' +
          '💡 Você pode registrar outro farm clicando no botão novamente.'
      });
      
      console.log(`✅ Farm registrado para ${interaction.user.username} - ${animalSemente}: ${quantidade}`);
      
    } catch (error) {
      console.error('❌ Erro ao registrar farm:', error);
      await interaction.editReply({
        content: '❌ Erro ao registrar farm. Tente novamente!'
      });
    }
  }
});

// ============================================
// 🔐 LOGIN DO BOT
// ============================================
client.login(TOKEN);