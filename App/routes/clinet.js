module.exports.setRouter = (app) => {
    app.get("/", (req, res) => {
        res.render(`broadcast`);
    });

    app.get("/view/:username/:socketid/:viewUser", (req, res) => {
        res.render(`index`, { userName: req.params.username, socketId: req.params.socketid, viewUser: req.params.viewUser });
    });
}