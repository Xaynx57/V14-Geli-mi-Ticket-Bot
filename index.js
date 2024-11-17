
const {
    Client,
    GatewayIntentBits,
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const config = require('./config.json');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const PREFIX = '.'; // Prefix tanımı

client.once('ready', () => {
    console.log(`${client.user.tag} olarak giriş yapıldı!`);
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Ticket Yardım Komutları
    if (command === 'ticket') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('Ticket Komutları')
            .setDescription('Aşağıda mevcut ticket komutlarını bulabilirsiniz:')
            .addFields(
                { name: '.ticket aç', value: 'Bir ticket oluşturur.' },
                { name: '.ticket kapat', value: 'Aktif ticketi kapatır.' }
            )
            .setColor('Blue');

        await message.channel.send({ embeds: [helpEmbed] });
    }

    // Ticket Açma Komutu
    if (command === 'ticket' && args[0] === 'aç') {
        const embed = new EmbedBuilder()
            .setTitle('Ticket Sistemi')
            .setDescription('Bir ticket oluşturmak için aşağıdaki butona tıklayın.')
            .setColor('Blue');

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('Ticket Oluştur')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [button] });
    }

    // Ticket Kapatma Komutu
    if (command === 'ticket' && args[0] === 'kapat') {
        if (!message.channel.name.startsWith('ticket-')) {
            return message.reply('Bu komut yalnızca bir ticket kanalında kullanılabilir!');
        }

        const confirmEmbed = new EmbedBuilder()
            .setTitle('Ticket Kapatma')
            .setDescription('Bu ticket’i kapatmak istediğinizden emin misiniz?')
            .setColor('Yellow');

        const confirmButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_close')
                .setLabel('Evet')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancel_close')
                .setLabel('Hayır')
                .setStyle(ButtonStyle.Secondary)
        );

        await message.channel.send({ embeds: [confirmEmbed], components: [confirmButtons] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'create_ticket') {
        const ticketName = `ticket-${interaction.user.username}`;

        const existingChannel = interaction.guild.channels.cache.find(
            (channel) => channel.name === ticketName
        );

        if (existingChannel) {
            return interaction.reply({ content: 'Zaten bir ticket açtınız!', ephemeral: true });
        }

        const ticketChannel = await interaction.guild.channels.create({
            name: ticketName,
            type: ChannelType.GuildText,
            topic: `Bu ticket ${interaction.user.tag} tarafından oluşturuldu.`,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: ['ViewChannel'], // Sunucudaki herkes göremeyecek
                },
                {
                    id: interaction.user.id,
                    allow: ['ViewChannel', 'SendMessages'], // Ticket sahibi görecek
                },
                {
                    id: config.STAFF_ROLE_ID,
                    allow: ['ViewChannel', 'SendMessages'], // Yetkili rolü görecek
                },
            ],
        });

        const ticketEmbed = new EmbedBuilder()
            .setTitle('Ticket Açıldı')
            .setDescription(`Merhaba ${interaction.user}, ticket'iniz başarıyla oluşturuldu!`)
            .setColor('Green');

        const closeButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Ticket Kapat')
                .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({
            content: `<@&${config.STAFF_ROLE_ID}> | ${interaction.user}`,
            embeds: [ticketEmbed],
            components: [closeButton],
        });

        await interaction.reply({
            content: `Ticket'iniz oluşturuldu: <#${ticketChannel.id}>`,
            ephemeral: true,
        });
    }

    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        const channel = interaction.channel;
        if (!channel.name.startsWith('ticket-')) {
            return interaction.reply({
                content: 'Bu komutu yalnızca bir ticket kanalında kullanabilirsiniz!',
                ephemeral: true,
            });
        }

        const confirmEmbed = new EmbedBuilder()
            .setTitle('Ticket Kapatma')
            .setDescription('Bu ticket’i kapatmak istediğinizden emin misiniz?')
            .setColor('Yellow');

        const confirmButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_close')
                .setLabel('Evet')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancel_close')
                .setLabel('Hayır')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [confirmEmbed], components: [confirmButtons] });
    }

    if (interaction.isButton() && interaction.customId === 'confirm_close') {
        const channel = interaction.channel;
        await interaction.reply('Ticket kapanıyor...');
        setTimeout(() => channel.delete(), 3000);
    }

    if (interaction.isButton() && interaction.customId === 'cancel_close') {
        await interaction.reply({
            content: 'Ticket kapatma işlemi iptal edildi.',
            ephemeral: true,
        });
    }
});

client.login(config.TOKEN);
