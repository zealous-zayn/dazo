module.exports.setRouter = (app) => {
    app.get("/", (req, res) => {
        res.render(`broadcast`);
    });

    app.get("/view/:username/:socketid", (req, res) => {
        res.render(`index`, { userName: req.params.username, socketId: req.params.socketid });
    });
}