import mongoose from "mongoose";
import supertest from "supertest";
import createServer from "../utils/server";
import * as UserService from "../service/user-service";
import * as SessionService from "../service/session-service";
import { createUserSessionHandler } from "../controllers/session-controller";
import { jest } from "@jest/globals";

const app = createServer();

const userId = new mongoose.Types.ObjectId().toString();

const userPayload = {
  _id: userId,
  email: "jane.doe@example.com",
  name: "Jane Doe",
};

const userInput = {
  email: "test@example.com",
  name: "Jane Doe",
  password: "Password123",
  passwordConfirmation: "Password123",
};

const sessionPayload = {
  _id: new mongoose.Types.ObjectId().toString(),
  user: userId,
  valid: true,
  userAgent: "PostmanRuntime/7.28.4",
  createdAt: new Date("2021-09-30T13:31:07.674Z"),
  updatedAt: new Date("2021-09-30T13:31:07.674Z"),
  __v: 0,
};

describe("User", () => {
  //user registration
  describe("User registration", () => {
    // the username and password get validation
    describe("given the username and password are valid", () => {
      it("should return the user payload", async () => {
        const createUserServiceSpy = jest
          .spyOn(UserService, "createUser")
          // @ts-ignore
          .mockResolvedValueOnce({ ...userPayload, toJSON: () => userPayload });

        const { statusCode, body } = await supertest(app)
          .post("/api/users")
          .send(userInput);

        expect(statusCode).toBe(201);

        expect(body).toEqual({
          message: "user created",
          user: userPayload,
        });

        expect(createUserServiceSpy).toHaveBeenCalledWith(userInput);
      });
    });
    // verify that the password match
    describe("given the passwords do not matc", () => {
      it("should return a 400", async () => {
        const createUserServiceSpy = jest
          .spyOn(UserService, "createUser")
          // @ts-ignore
          .mockResolvedValueOnce({ ...userPayload, toJSON: () => userPayload });

        const { statusCode } = await supertest(app)
          .post("/api/users")
          .send({ ...userInput, passwordConfirmation: "doesnotmatch" });

        expect(statusCode).toBe(400);

        expect(createUserServiceSpy).not.toHaveBeenCalled();
      });
    });
    // verify that the handler handles any errors
    describe("given the user service throws", () => {
      it("should return a 409", async () => {
        const createUserServiceSpy = jest
          .spyOn(UserService, "createUser")
          .mockRejectedValue("oh no :(");

        const { statusCode } = await supertest(app)
          .post("/api/users")
          .send(userInput);

        expect(statusCode).toBe(409);

        expect(createUserServiceSpy).toHaveBeenCalled();
      });
    });
  });

  describe("create user session", () => {
    //creating a user session
    describe("given the username and password are valid", () => {
      it("should return a signed accessToken and refreshToken", async () => {
        jest
          .spyOn(UserService, "validatePassword")
          // @ts-ignore
          .mockResolvedValue({ ...userPayload, toJSON: () => userPayload });
        jest
          .spyOn(SessionService, "createSession")
          // @ts-ignore
          .mockResolvedValueOnce(sessionPayload);

        const req = {
          get: () => {
            return "a user agent";
          },
          body: { email: "test@example.com", password: "password123" },
        };

        const send = jest.fn();

        const res = { send };

        //@ts-ignore
        await createUserSessionHandler(req, res);

        expect(send).toHaveBeenCalledWith({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        });
      });
    });
  });

  //user login with a valid email and passoword
});
