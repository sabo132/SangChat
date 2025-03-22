const express = require('express');
const app = express();
const port = 3000;
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
});

const Comments = sequelize.define('Comments', {
    content: {
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
    res.render('index', { comments: comments });
});

app.post('/create', async (req, res) => {
    console.log(req.body);
    const { content } = req.body;
    const comment = await Comments.create({ content: content});
    console.log(comment.id);
    res.redirect('/');
});

app.post('/update/:id', async (req, res) => {
    console.log(req.params);
    console.log(req.body);
    const { id } = req.params;
    const { content } = req.body;
    await Comments.update({ content: content }, {
        where: {
            id: id
        }
    });

  res.redirect('/');
});

app.post('/delete/:id', async(req, res) => {
    console.log(req.params);
    const {id} = req.params;
    await Comments.destroy({
        where: {
            id: id
        }
    });
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Example app listening on port $port}`);
});
