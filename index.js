const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const port = 3000;

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
});

// 세션 설정
app.use(session({
    secret: 'secret-key', // 실제 환경에서는 강력한 키 사용
    resave: false,
    saveUninitialized: false
}));

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// 사용자 모델
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// 댓글 모델
const Comments = sequelize.define('Comments', {
    content: {
        type: DataTypes.STRING,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

// 데이터베이스 동기화
(async () => {
    await sequelize.sync({ alter: true });
    console.log("DB 초기화 완료!");
})();

// 홈 페이지
app.get('/', async (req, res) => {
    const comments = await Comments.findAll();
    res.render('index', { comments, user: req.session.user });
});

// 회원가입 페이지
app.get('/register', (req, res) => {
    res.render('register');
});

// 회원가입 처리
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    res.redirect('/login');
});

// 로그인 페이지
app.get('/login', (req, res) => {
    res.render('login');
});

// 로그인 처리
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = { id: user.id, username: user.username };
        res.redirect('/');
    } else {
        res.send("로그인 실패! 아이디 또는 비밀번호가 틀립니다.");
    }
});

// 로그아웃
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// 댓글 작성
app.post('/create', async (req, res) => {
    if (!req.session.user) return res.status(401).send("로그인이 필요합니다.");

    await Comments.create({
        content: req.body.content,   // ✅ 사용자가 입력한 댓글 내용만 가져옴
        username: req.session.user.username,  // ✅ 세션에서 가져온 유저 이름
        userId: req.session.user.id  // ✅ 세션에서 가져온 유저 ID
    });

    res.redirect('/');
});
// 댓글 수정
app.post('/update/:id', async (req, res) => {
    if (!req.session.user) return res.status(401).send("로그인이 필요합니다.");

    const { id } = req.params;
    const { content } = req.body;
    const comment = await Comments.findOne({ where: { id } });

    if (!comment || comment.userId !== req.session.user.id) {
        return res.status(403).send("수정 권한이 없습니다.");
    }

    await Comments.update({ content }, { where: { id } });
    res.redirect('/');
});

// 댓글 삭제
app.post('/delete/:id', async (req, res) => {
    if (!req.session.user) return res.status(401).send("로그인이 필요합니다.");

    const { id } = req.params;
    const comment = await Comments.findOne({ where: { id } });

    if (!comment || comment.userId !== req.session.user.id) {
        return res.status(403).send("삭제 권한이 없습니다.");
    }

    await Comments.destroy({ where: { id } });
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});