const supertest = require("supertest");
const app = require("../..");
const { clearDatabase } = require("../../db.connection");

let req = supertest(app);

describe("lab testing:", () => {
  describe("users routes:", () => {
    let newUser, userInDB;
    beforeAll(async () => {
      newUser = {
        name: "nour",
        email: "nourakram@gmail.com",
        password: "123",
      };
      let signupResponse = await req.post("/user/signup").send(newUser);
      // console.log("newUser", signupResponse.body.data);
      userInDB = signupResponse.body.data;
    });

    // Note: user name must be sent in req query not req params
    it("req to get(/user/search) ,expect to get the correct user with his name", async () => {
      let res = await req.get("/user/search").query({ name: "nour" });
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(userInDB);
    });
    it("req to get(/user/search) with invalid name ,expect res status and res message to be as expected", async () => {
      let res = await req.get("/user/search").query({ name: "mohamed" });
      expect(res.status).toBe(404);
      expect(res.body.message).toContain("no user");
    });
  });

  ///////////////////////////////////////////////////////////////////////////////
  describe("todos routes:", () => {
    let newUser, token, createdTodo, userIdInDB;

    beforeAll(async () => {
      newUser = {
        name: "nour",
        email: "nourakram286@gmail.com",
        password: "123",
      };
      let userRegister = await req.post("/user/signup").send(newUser);
      // console.log("regiter", userRegister.body.data);

      userIdInDB = userRegister.body.data._id;
      // console.log("useriddb", userIdInDB);

      let loginuser = await req.post("/user/login").send(newUser);
      // console.log("login", loginuser.body.data);

      token = loginuser.body.data;

      let todo = await req
        .post("/todo")
        .send({ title: "reading book" })
        .set({ authorization: token });
      // console.log("todo", todo.body.data);
      createdTodo = todo.body.data;
      //   console.log("Created Todo:", createdTodo);
    });

    it("req to patch( /todo/) with id only ,expect res status and res message to be as expected", async () => {
      let res = await req
        .patch("/todo/" + createdTodo._id)
        .set({ authorization: token });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("must provide title and id to edit todo");
    });

    it("req to patch( /todo/) with id and title ,expect res status and res to be as expected", async () => {
      let res = await req
        .patch("/todo/" + createdTodo._id)
        .send({ title: "reading book 2" })
        .set({ authorization: token });
      expect(res.status).toBe(200);
      //   console.log(res.body);
      expect(res.body.data).toBeDefined();
    });

    it("req to get( /todo/user) ,expect to get all user's todos", async () => {
      let res = await req.get("/todo/user").set({ authorization: token });

      //    console.log("Response from GET /todo/user:", res.body);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it("req to get(/todo/user) ,expect to not get any todos for user who hasn't any todo", async () => {
      let newUserWithoutTodos = {
        name: "testUser",
        email: "testuser@gmail.com",
        password: "12345",
      };

      await req.post("/user/signup").send(newUserWithoutTodos);
      let loginUser = await req.post("/user/login").send(newUserWithoutTodos);
      let newUserToken = loginUser.body.data;

      let res = await req
        .get("/todo/user")
        .set({ authorization: newUserToken });

    //   console.log("Response from GET /todo/user for new user:", res.body);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Couldn't find any todos for");
    });
  });

  afterAll(async () => {
    await clearDatabase();
  });
});
