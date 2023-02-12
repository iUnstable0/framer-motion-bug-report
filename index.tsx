import { useState, useEffect, useRef } from "react";

import Head from "next/head";

import { useRouter } from "next/router";

// Additional Packages

import toast from "react-hot-toast";
import axios from "axios";

import { motion, AnimatePresence } from "framer-motion";
import { setCookie } from "cookies-next";

// import * as lib from "modules";
import lib_auth from "modules/auth";
import lib_toaster from "modules/toaster";
import lib_axios from "modules/axios";
import lib_gqlSchema from "modules/gqlSchema";

// Components

import Toaster from "components/toaster";
import FormBuilder from "components/formBuilder";

// @ts-ignore
import * as Unicons from "@iconscout/react-unicons";

// Styles

import formStyles from "styles/Form.module.scss";

export async function getServerSideProps(context: any) {
	return await lib_auth.check({
		context: context,
		reverse: true,
		source: "cookie",
		tokenType: "account",
		query: `
			query {
				user {
					account {
						username
					}
				}
			}
		`,
	});
}

const captchaSettings = {
	login: {
		provider: "cloudflare",
		invisible: {
			cloudflare: true,
			hcaptcha: true,
		},
		action: "Login",
	},
};

export default function Page() {
	const router = useRouter();

	const [formVisible, setFormVisible] = useState<any>(true);

	return (
		<>
			<Head>
				<title>Login - Falcon Serverside</title>
			</Head>

			<Toaster />

			<AnimatePresence>
				{formVisible && (
					<motion.div
						key={router.route}
						initial="pageInitial"
						animate="pageAnimate"
						exit="pageExit"
						variants={{
							pageInitial: {
								opacity: 0,
							},
							pageAnimate: {
								opacity: 1,
							},
							pageExit: {
								opacity: 0,
							},
						}}
						transition={{
							duration: 0.15,
						}}
					>
						<FormBuilder
							title="Login"
							inputs={[
								{
									type: "text",
									name: "identifier",
									autoComplete: "username",
									placeholder: "Email/Username",
									required: true,
									toast: {
										name: "Email/Username",
										loading: "",
										success: "",
									},
									onChange: async (value: any) => {
										return {
											success: true,
										};
									},
									delay: 0,
									Unicon: Unicons.UilUser,
								},
								{
									type: "password",
									name: "password",
									autoComplete: "current-password",
									placeholder: "Password",
									required: true,
									toast: {
										name: "Password",
										loading: "",
										success: "",
									},
									onChange: async (value: any) => {
										return {
											success: true,
										};
									},
									delay: 0,
								},
							]}
							submitButtonText="Login"
							bottomTexts={[
								{
									text: "Don't have an account?",
									linkText: "Register",
									onClick: () => {
										setFormVisible(false);

										setTimeout(() => {
											router.push("/register");
										}, 250);
									},
								},
								{
									text: "Forgot Password?",
									linkText: "Reset Password",
									onClick: () => {
										setFormVisible(false);

										setTimeout(() => {
											router.push("/reset-password");
										}, 250);
									},
								},
							]}
							captcha={captchaSettings.login}
							onSubmit={(options: any) => {
								toast.promise(
									lib_axios.request({
										method: "POST",
										url: "/gql",
										baseURL: process.env.NEXT_PUBLIC_GQL,
										headers: {
											"Content-Type": "application/json",
										},
										data: {
											query: lib_gqlSchema.mutation.login,
											variables: {
												captchaToken: options.captchaToken,
												provider: captchaSettings.login.provider,
												identifier: options.inputData.identifier,
												password: options.inputData.password,
											},
										},
									}),
									{
										loading: "Logging in",
										success: (response: any) => {
											const data = response.data.data.login;

											setFormVisible(false);

											if (data.success) {
												setCookie("token", data.token, {
													path: "/",
													maxAge: 60 * 60 * 24 * 7,
													sameSite: "strict",
													secure: process.env.NEXT_PUBLIC_ENVIRONMENT === "development" ? false : true,
												});

												setTimeout(() => {
													router.push("/dashboard");
												}, 250);
											} else {
												setTimeout(() => {
													router.push(`/checkpoint?token=${data.token}`);
												}, 250);
											}

											return "Logged in";
										},
										error: (error: any) => {
											options.setSubmitButtonValue("Login");
											options.setSubmitButtonDisabled(false);

											if (
												options.captchaRef.current &&
												((!captchaSettings.login.invisible.cloudflare && captchaSettings.login.provider === "cloudflare") ||
													(!captchaSettings.login.invisible.hcaptcha && captchaSettings.login.provider === "hcaptcha"))
											) {
												// Reset if hCaptcha is on form OR turnstile is invisible (it'll be on the modal instead that unmounts)
												options.resetCaptcha(captchaSettings.login.provider);
												options.setCaptchaToken("");
											}

											// setcaptchaToken(null);
											// hcaptchaRef.current.resetCaptcha();

											return lib_toaster.multiToast("error", lib_axios.parseError(error));
										},
									}
								);
							}}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
