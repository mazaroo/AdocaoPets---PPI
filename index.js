const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
    session({
        secret: 'loginpets',
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 30 * 60 * 1000 }
    })
);

function verificarLogin(req, res, next) {
    if (req.session.logado) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    res.send(`
        <h2>Login</h2>
        <form method="post" action="/login">
            Usuário:<br>
            <input type="text" name="usuario"><br><br>

            Senha:<br>
            <input type="password" name="senha"><br><br>

            <button type="submit">Entrar</button>
        </form>
    `);
});

app.post('/login', (req, res) => {
    const usuario = req.body.usuario;
    const senha = req.body.senha;

    if (usuario === 'admin' && senha === '123') {
        req.session.logado = true;

        const dataHora = new Date().toLocaleString('pt-BR');
        res.cookie('ultimoAcesso', dataHora);

        res.redirect('/menu');
    } else {
        res.send(`
            <p>Login inválido</p>
            <a href="/login">Voltar</a>
        `);
    }
});

app.get('/menu', verificarLogin, (req, res) => {
    const ultimo = req.cookies.ultimoAcesso || 'Primeiro acesso';

    res.send(`
        <h2>Menu</h2>
        <p>Último acesso: ${ultimo}</p>

        <a href="/interessados/cadastrar">Cadastro de Interessados</a><br>
        <a href="/pets/cadastrar">Cadastro de Pets</a><br>
        <a href="/desejos/cadastrar">Adotar um Pet</a><br><br>

        <a href="/logout">Sair</a>
    `);
});

let interessados = [];
let idInteressado = 1;

app.get('/interessados/cadastrar', verificarLogin, (req, res) => {
    res.send(`
        <h2>Cadastro de Interessado</h2>

        <form method="post" action="/interessados/cadastrar">
            Nome:<br>
            <input type="text" name="nome"><br><br>

            Email:<br>
            <input type="email" name="email"><br><br>

            Telefone:<br>
            <input type="text" name="telefone"><br><br>

            <button type="submit">Cadastrar</button>
        </form>

        <br>
        <a href="/menu">Voltar ao menu</a><br>
        <a href="/interessados">Ver interessados cadastrados</a>
    `);
});

app.post('/interessados/cadastrar', verificarLogin, (req, res) => {
    const nome = req.body.nome;
    const email = req.body.email;
    const telefone = req.body.telefone;

    if (!nome || !email || !telefone ||
        nome.trim() === '' || email.trim() === '' || telefone.trim() === '') {

        res.send(`
            <p>Todos os campos são obrigatórios.</p>
            <a href="/interessados/cadastrar">Voltar</a>
        `);
        return;
    }

    interessados.push({
        id: idInteressado++,
        nome: nome,
        email: email,
        telefone: telefone
    });

    res.redirect('/interessados');
});

app.get('/interessados', verificarLogin, (req, res) => {
    let html = `<h2>Interessados em adoção</h2>`;

    if (interessados.length === 0) {
        html += `<p>Nenhum interessado cadastrado.</p>`;
    } else {
        html += `<ul>`;
        interessados.forEach(i => {
            html += `<li>${i.nome} - ${i.email} - ${i.telefone}</li>`;
        });
        html += `</ul>`;
    }

    html += `
        <br>
        <a href="/interessados/cadastrar">Cadastrar novo interessado</a><br>
        <a href="/menu">Voltar ao menu</a>
    `;

    res.send(html);
});

let pets = [];
let idPet = 1;

app.get('/pets/cadastrar', verificarLogin, (req, res) => {
    res.send(`
        <h2>Cadastro de Pet</h2>

        <form method="post" action="/pets/cadastrar">
            Nome do pet:<br>
            <input type="text" name="nome"><br><br>

            Espécie (cachorro, gato, etc):<br>
            <input type="text" name="especie"><br><br>

            Raça:<br>
            <input type="text" name="raca"><br><br>

            Idade:<br>
            <input type="number" name="idade"><br><br>

            <button type="submit">Cadastrar</button>
        </form>

        <br>
        <a href="/menu">Voltar ao menu</a><br>
        <a href="/pets">Ver pets cadastrados</a>
    `);
});

app.post('/pets/cadastrar', verificarLogin, (req, res) => {
    let nome = req.body.nome;
    let especie = req.body.especie;
    let raca = req.body.raca;
    let idade = req.body.idade;

    if (!nome || !especie || !raca || !idade ||
        nome.trim() === '' || especie.trim() === '' ||
        raca.trim() === '' || idade.trim() === '') {

        res.send(`
            <p>Todos os campos são obrigatórios.</p>
            <a href="/pets/cadastrar">Voltar</a>
        `);
        return;
    }

    pets.push({
        id: idPet++,
        nome: nome,
        especie: especie,
        raca: raca,
        idade: idade
    });

    res.redirect('/pets');
});

app.get('/pets', verificarLogin, (req, res) => {
    let html = `<h2>Pets cadastrados</h2>`;

    if (pets.length === 0) {
        html += `<p>Nenhum pet cadastrado.</p>`;
    } else {
        html += `<ul>`;
        pets.forEach(p => {
            html += `
                <li>
                    ${p.nome} - ${p.especie} - ${p.raca} - ${p.idade} anos
                </li>
            `;
        });
        html += `</ul>`;
    }

    html += `
        <br>
        <a href="/pets/cadastrar">Cadastrar novo pet</a><br>
        <a href="/menu">Voltar ao menu</a>
    `;

    res.send(html);
});

let adocoes = [];
let idAdocao = 1;

app.get('/desejos/cadastrar', verificarLogin, (req, res) => {
    if (interessados.length === 0 || pets.length === 0) {
        res.send(`
            <p>É necessário ter interessados e pets cadastrados antes de registrar uma adoção.</p>
            <a href="/menu">Voltar ao menu</a>
        `);
        return;
    }

    let optionsInteressados = '';
    interessados.forEach(i => {
        optionsInteressados += `<option value="${i.id}">${i.nome}</option>`;
    });

    let optionsPets = '';
    pets.forEach(p => {
        optionsPets += `<option value="${p.id}">${p.nome} (${p.especie})</option>`;
    });

    res.send(`
        <h2>Registrar Adoção</h2>

        <form method="post" action="/desejos/cadastrar">
            Interessado:<br>
            <select name="interessadoId">
                ${optionsInteressados}
            </select><br><br>

            Pet:<br>
            <select name="petId">
                ${optionsPets}
            </select><br><br>

            <button type="submit">Registrar adoção</button>
        </form>

        <br>
        <a href="/menu">Voltar ao menu</a><br>
        <a href="/desejos">Ver adoções registradas</a>
    `);
});

app.post('/desejos/cadastrar', verificarLogin, (req, res) => {
    const interessadoId = parseInt(req.body.interessadoId);
    const petId = parseInt(req.body.petId);

    const interessado = interessados.find(i => i.id === interessadoId);
    const pet = pets.find(p => p.id === petId);

    if (!interessado || !pet) {
        res.send(`
            <p>Erro ao registrar adoção.</p>
            <a href="/menu">Voltar</a>
        `);
        return;
    }

    adocoes.push({
        id: idAdocao++,
        interessado,
        pet
    });

    res.redirect('/desejos');
});

app.get('/desejos', verificarLogin, (req, res) => {
    let html = `<h2>Adoções registradas</h2>`;

    if (adocoes.length === 0) {
        html += `<p>Nenhuma adoção registrada.</p>`;
    } else {
        html += `<ul>`;
        adocoes.forEach(a => {
            html += `
                <li>
                    ${a.interessado.nome} adotou ${a.pet.nome} (${a.pet.especie})
                </li>
            `;
        });
        html += `</ul>`;
    }

    html += `
        <br>
        <a href="/desejos/cadastrar">Registrar nova adoção</a><br>
        <a href="/menu">Voltar ao menu</a>
    `;

    res.send(html);
});


app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
