const express = require('express');
const app = express();
const port = 3000;
const { Sequelize, DataTypes } = require('sequelize');
const jwt = require("jsonwebtoken");

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
});

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
        type: DataTypes.STRING,
        allowNull: false
    }
});

(async () => {
    await Comments.sync({ force: true });
    console.log("The table for the User model was just (re)created!");
})();

let comments = [];

app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.get('/', async (req, res) => {
    const comments = await Comments.findAll();

   
    const loggedInUserId = "exampleUserId";  
    res.render('index', { comments: comments, loggedInUserId: loggedInUserId });
});

app.post('/create', async (req, res) => {
    console.log(req.body);
    const { content } = req.body;

    // `username`을 하드코딩
    const username = "exampleUser";  // 로그인 기능을 추가하면 이 값을 동적으로 설정

    const loggedInUserId = "exampleUserId";  // 테스트용 사용자 ID

    try {
        const comment = await Comments.create({
            content: content,
            username: username,  // `username` 값을 함께 저장
            userId: loggedInUserId
        });
        console.log(comment.id);
        res.redirect('/');
    } catch (error) {
        console.error("에러 발생:", error);
        res.status(500).send("서버에서 오류가 발생했습니다.");
    }
});
app.post('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const currentUser = "exampleUser";  // 현재 로그인한 사용자 (테스트용 하드코딩)

        // DB에서 댓글 조회
        const comment = await Comments.findOne({ where: { id: id } });

        if (!comment) {
            return res.status(404).send("댓글을 찾을 수 없습니다.");
        }

        // 작성자만 수정할 수 있도록 검증
        if (comment.username !== currentUser) {
            return res.status(403).send("수정 권한이 없습니다.");
        }

        await Comments.update({ content: content }, { where: { id: id } });
        res.redirect('/');
    } catch (error) {
        console.error("에러 발생:", error);
        res.status(500).send("서버에서 오류가 발생했습니다.");
    }
});

app.post('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = "exampleUser";  // 현재 로그인한 사용자 (테스트용 하드코딩)

        // DB에서 댓글 조회
        const comment = await Comments.findOne({ where: { id: id } });

        if (!comment) {
            return res.status(404).send("댓글을 찾을 수 없습니다.");
        }

        // 작성자만 삭제할 수 있도록 검증
        if (comment.username !== currentUser) {
            return res.status(403).send("삭제 권한이 없습니다.");
        }

        await Comments.destroy({ where: { id: id } });
        res.redirect('/');
    } catch (error) {
        console.error("에러 발생:", error);
        res.status(500).send("서버에서 오류가 발생했습니다.");
    }
});
app.listen(port, () => {
    console.log(`Example app listening on port $port}`);
});
