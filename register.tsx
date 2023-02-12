import { useState, useEffect, useRef, useCallback } from "react";

import Head from "next/head";
import Link from "next/link";

import { useRouter } from "next/router";

// Additional Packages

import toast from "react-hot-toast";
import axios from "axios";

import { motion, AnimatePresence, useSpring, m } from "framer-motion";
import { setCookie } from "cookies-next";

// import * as lib from "modules";
import lib_auth from "modules/auth";
import lib_toaster from "modules/toaster";
import lib_axios from "modules/axios";
import lib_password from "modules/password";
import lib_gqlSchema from "modules/gqlSchema";

// @ts-ignore
import * as Unicons from "@iconscout/react-unicons";

// Components

import Captcha from "components/captcha";
import Toaster from "components/toaster";

// Styles

import formStyles from "styles/Form.module.scss";

const captchaSettings = {
	register: {
		provider: "cloudflare",
		invisible: {
			cloudflare: true,
			hcaptcha: true,
		},
		action: "Register",
	},
};

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

export default function Page() {
	const router = useRouter();

	const [formVisible, setFormVisible] = useState<any>(true),
		[captchaModalOpen, setCaptchaModalOpen] = useState<any>(false),
		[page1Visible, setPage1Visible] = useState<any>(true),
		[page2Init, setPage2Init] = useState<any>(false),
		[page2Visible, setPage2Visible] = useState<any>(false),
		[page3Visible, setPage3Visible] = useState<any>(false);

	const [emailValid, setEmailValid] = useState<any>(null),
		[usernameValid, setUsernameValid] = useState<any>(null),
		[passwordValid, setPasswordValid] = useState<any>(null),
		[licenseIdValid, setLicenseIdValid] = useState<any>(null),
		[licenseKeyValid, setLicenseKeyValid] = useState<any>(null);

	const [submitButtonValue, setSubmitButtonValue] = useState<any>("Next"),
		[submitButtonDisabled, setSubmitButtonDisabled] = useState<any>(true);

	const [captchaToken, setCaptchaToken] = useState<any>(""),
		[passwordHidden, setPasswordHidden] = useState<any>(true),
		[passwordErrors, setPasswordErrors] = useState<any>([]),
		[inputData, setInputData] = useState<any>({}),
		[page, setPage] = useState<any>(1);

	const emailInputRef = useRef<any>(null),
		usernameInputRef = useRef<any>(null),
		passwordInputRef = useRef<any>(null),
		licenseIdInputRef = useRef<any>(null),
		licenseKeyInputRef = useRef<any>(null),
		captchaRef = useRef<any>(null);

	const togglePassword = () => {
			setPasswordHidden(!passwordHidden);

			if (passwordInputRef.current) passwordInputRef.current.type = passwordHidden ? "text" : "password";
		},
		resetCaptcha = () => {
			if (!captchaRef.current) return;

			if (captchaSettings.register.provider === "cloudflare") {
				captchaRef.current.reset();
			} else {
				captchaRef.current.resetCaptcha();
			}
		},
		changePage = async (page: number) => {
			if (page === 1) {
				setPage1Visible(true);
				setPage2Init(false);
				setPage2Visible(false);
				setPage3Visible(false);
			} else if (page === 2) {
				setPage1Visible(false);
				setPage2Init(true);
				setPage2Visible(false);
				setPage3Visible(false);
			} else if (page === 3) {
				setPage1Visible(false);
				setPage2Init(false);
				setPage2Visible(false);
				setPage3Visible(true);
			}

			// return;

			setTimeout(() => {
				setPage(page);

				setSubmitButtonDisabled(true);

				if (page === 1) {
					setSubmitButtonValue("Next");

					const interval = setInterval(() => {
						if (emailInputRef.current) {
							clearInterval(interval);

							emailInputRef.current.focus();

							if (inputData.email) emailInputRef.current.value = inputData.email;
						}
					}, 1);
				} else if (page === 2) {
					setPage2Init(false);
					setPage2Visible(true);

					setSubmitButtonValue("Next");

					const interval = setInterval(() => {
						if (usernameInputRef.current && passwordInputRef.current) {
							clearInterval(interval);

							usernameInputRef.current.focus();

							if (inputData.username) usernameInputRef.current.value = inputData.username;
							if (inputData.password) passwordInputRef.current.value = inputData.password;
						}
					}, 1);
				} else if (page === 3) {
					setSubmitButtonValue("Register");

					const interval = setInterval(() => {
						if (licenseIdInputRef.current && licenseKeyInputRef.current) {
							clearInterval(interval);

							licenseIdInputRef.current.focus();

							if (inputData.licenseId) licenseIdInputRef.current.value = inputData.licenseId;
							if (inputData.licenseKey) licenseKeyInputRef.current.value = inputData.licenseKey;
						}
					}, 1);
				}
			}, 200);
		},
		advancePage = () => {
			if (page < 3) {
				changePage(page + 1);
			}
		},
		goBack = () => {
			if (page > 1) {
				changePage(page - 1);
			}
		},
		saveInput = (input: string, value: any) => {
			let data = inputData;

			data[input] = value;

			setInputData(data);
		},
		register = async (token: string) => {
			toast.promise(
				lib_axios.request({
					method: "POST",
					url: "/gql",
					baseURL: process.env.NEXT_PUBLIC_GQL,
					headers: {
						"Content-Type": "application/json",
					},
					data: {
						query: lib_gqlSchema.mutation.register,
						variables: {
							captchaToken: token,
							provider: captchaSettings.register.provider,
							email: inputData.email,
							username: inputData.username,
							password: inputData.password,
							licenseId: inputData.licenseId,
							licenseKey: inputData.licenseKey,
						},
					},
				}),
				{
					loading: "Registering",
					success: (response: any) => {
						const data = response.data.data.register;

						setCookie("token", data.token, {
							path: "/",
							maxAge: 60 * 60 * 24 * 7,
							sameSite: "strict",
							secure: process.env.NEXT_PUBLIC_ENVIRONMENT === "development" ? false : true,
						});

						setFormVisible(false);

						setTimeout(() => {
							router.push("/dashboard");
						}, 150);

						return "Registered";
					},
					error: (error) => {
						setSubmitButtonValue("Register");
						setSubmitButtonDisabled(false);

						if (
							captchaRef.current &&
							((!captchaSettings.register.invisible.cloudflare && captchaSettings.register.provider === "cloudflare") ||
								(!captchaSettings.register.invisible.hcaptcha && captchaSettings.register.provider === "hcaptcha"))
						) {
							// Reset if hCaptcha is on form OR turnstile is invisible (it'll be on the modal instead that unmounts)
							resetCaptcha();
							setCaptchaToken("");
						}

						return lib_toaster.multiToast("error", lib_axios.parseError(error));
					},
				}
			);
		};

	// useEffect(() => {
	// 	setInterval(() => {
	// 		if (formRef.current) {
	// 			// Calculate the form height

	// 			const form = formRef.current,
	// 				formHeight = form.clientHeight;

	// 			setFormHeight(formHeight);
	// 		}
	// 	}, 1500);
	// }, []);

	// useEffect(() => {
	// 	setMinHeight(page1Visible ? "239px" : page2Init ? "323px" : page2Visible ? "323px" : page3Visible ? "323px" : "239px");
	// 	setMaxHeight(page1Visible ? "239px" : page2Init ? "323px" : page2Visible ? "406px" : page3Visible ? "323px" : "239px");
	// }, [page1Visible, page2Init, page2Visible, page3Visible]);

	useEffect(() => {
		const checkFields = (fields: Array<any>) => {
			if (page === 3) {
				if (
					(captchaSettings.register.provider === "cloudflare" && !captchaSettings.register.invisible.cloudflare) ||
					(captchaSettings.register.provider === "hcaptcha" && !captchaSettings.register.invisible.hcaptcha)
				) {
					if (captchaToken === "") {
						setSubmitButtonDisabled(true);

						return false;
					}
				}
			}

			let valid = true;

			fields.forEach((field) => {
				if (field === null) {
					valid = false;
				} else if (field === false) {
					valid = false;
				}
			});

			return valid;
		};

		if (page === 1) {
			if (checkFields([emailValid])) {
				setSubmitButtonValue("Next");
				setSubmitButtonDisabled(false);
			} else {
				setSubmitButtonDisabled(true);
			}
		} else if (page === 2) {
			if (checkFields([emailValid, usernameValid, passwordValid])) {
				setSubmitButtonValue("Next");
				setSubmitButtonDisabled(false);
			} else {
				setSubmitButtonDisabled(true);
			}
		} else {
			if (checkFields([emailValid, usernameValid, passwordValid, licenseIdValid, licenseKeyValid])) {
				setSubmitButtonValue("Register");
				setSubmitButtonDisabled(false);
			} else {
				setSubmitButtonDisabled(true);
			}
		}
	}, [page, emailValid, usernameValid, passwordValid, licenseIdValid, licenseKeyValid, captchaToken]);

	useEffect(() => {
		console.log(formVisible);
	}, [formVisible]);

	return (
		<>
			<Head>
				<title>Register - Falcon Serverside</title>
			</Head>

			<Toaster />

			<AnimatePresence>
				{formVisible && (
					// <motion.div
					// 	key={router.route}
					// 	initial="pageInitial"
					// 	animate="pageAnimate"
					// 	exit="pageExit"
					// 	variants={{
					// 		pageInitial: {
					// 			opacity: 0,
					// 		},
					// 		pageAnimate: {
					// 			opacity: 1,
					// 		},
					// 		pageExit: {
					// 			opacity: 0,
					// 		},
					// 	}}
					// 	transition={{
					// 		duration: 0.15,
					// 	}}
					// >
					<motion.div
						className={formStyles.container}
						style={{
							minHeight: page1Visible ? "239px" : page2Init ? "323px" : page2Visible ? "323px" : page3Visible ? "323px" : "239px",
							maxHeight: page1Visible ? "239px" : page2Init ? "323px" : page2Visible ? "406px" : page3Visible ? "323px" : "239px",
							// maxHeight: page1Visible ? "239px" : page2Visible ? "406px" : page3Visible ? "323px" : "239px",
						}}
						key={"registerForm"}
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
						<h1 className={formStyles.title}>Register</h1>

						<form
							onSubmit={async (event) => {
								event.preventDefault();

								if (page === 3) {
									setSubmitButtonDisabled(true);
									setSubmitButtonValue("Please wait...");

									if (captchaSettings.register.provider === "hcaptcha" && captchaSettings.register.invisible.hcaptcha) {
										captchaRef.current.execute();

										return;
									}

									if (captchaSettings.register.provider === "cloudflare" && captchaSettings.register.invisible.cloudflare) {
										setCaptchaModalOpen(true);

										return;
									}

									// setCaptchaModalOpen(true);

									await register(captchaToken);

									return;
								}

								advancePage();
							}}
						>
							{/* <div
									style={{
										opacity: 0,
									}}
								>
									{page1Visible && (
										<div className={formStyles["input-field"]}>
											<div className={formStyles.input} />
										</div>
									)}

									{page2Visible && (
										<>
											<div className={formStyles["input-field"]}>
												<div className={formStyles.input} />
											</div>
											<div className={formStyles["input-field"]}>
												<div className={formStyles.input} />
											</div>
										</>
									)}

									{page3Visible && (
										<>
											<div className={formStyles["input-field"]}>
												<div className={formStyles.input} />
											</div>
											<div className={formStyles["input-field"]}>
												<div className={formStyles.input} />
											</div>
										</>
									)}
								</div> */}

							{/* <div> */}
							<AnimatePresence>
								{page === 1 && page1Visible && (
									<motion.div
										className={formStyles.page}
										key={page}
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
										<div
											className={formStyles["input-field"]}
											style={{
												boxShadow: `${emailValid === null ? "none" : emailValid ? "0px 0px 3px #00C853" : "0px 0px 3px #EF5350"}`,
											}}
										>
											<input
												className={formStyles.input}
												type="text"
												autoComplete="email"
												placeholder="Email"
												required
												onChange={(event) => {
													setEmailValid(null);

													const email = event.target.value;

													saveInput("email", email);

													if (email.replace(/\s/g, "").length === 0) {
														toast.error("Email cannot be empty");

														setEmailValid(false);

														return;
													}

													setTimeout(async () => {
														if (email === event.target.value) {
															toast.promise(
																lib_axios.request({
																	method: "POST",
																	url: `/gql`,
																	baseURL: process.env.NEXT_PUBLIC_GQL,
																	headers: {
																		"Content-Type": "application/json",
																	},
																	data: {
																		query: lib_gqlSchema.query.emailValid,
																		variables: {
																			email: emailInputRef.current.value,
																		},
																	},
																}),
																{
																	loading: "Checking email",
																	success: (response: any) => {
																		const data = response.data.data.emailValid;

																		setEmailValid(data.available);

																		if (data.available) {
																			return "Email available";
																		} else {
																			return data.error;
																		}
																	},
																	error: (error) => lib_toaster.multiToast("error", lib_axios.parseError(error)),
																}
															);
														}
													}, 700);
												}}
												ref={emailInputRef}
											/>

											<Unicons.UilEnvelope className={`${formStyles["input-icon"]} ${formStyles["left-input-icon"]}`} />
										</div>

										<input
											className={formStyles["submit-button"]}
											type="submit"
											value={submitButtonValue}
											disabled={submitButtonDisabled}
										/>

										{/* <motion.div
											className={formStyles["bottom-text"]}
											key={`1_login`}
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
										> */}
										<div className={formStyles["bottom-text"]}>
											Already have an account?{" "}
											<button
												className={formStyles.link}
												type="button"
												onClick={() => {
													setFormVisible(false);

													setTimeout(() => {
														router.push("/");
													}, 150);
												}}
											>
												Login
											</button>
										</div>
										{/* </motion.div> */}
									</motion.div>
								)}

								{page === 2 && page2Visible && (
									<motion.div
										className={formStyles.page}
										key={page}
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
										<div
											className={formStyles["input-field"]}
											style={{
												boxShadow: `${usernameValid === null ? "none" : usernameValid ? "0px 0px 3px #00C853" : "0px 0px 3px #EF5350"}`,
											}}
										>
											<input
												className={formStyles.input}
												type="text"
												autoComplete="username"
												placeholder="Username"
												required
												onChange={(event) => {
													setUsernameValid(null);

													const username = event.target.value;

													saveInput("username", username);

													if (username.replace(/\s/g, "").length === 0) {
														toast.error("Username cannot be empty");

														setUsernameValid(false);

														return;
													}

													setTimeout(async () => {
														if (username === event.target.value) {
															// const response = lib_axios.request({
															// 	method: "GET",
															// 	url: `/api/users/check-email?email=${encodeURIComponent(
															// 		email
															// 	)}`,
															// });

															toast.promise(
																lib_axios.request({
																	method: "POST",
																	url: `/gql`,
																	baseURL: process.env.NEXT_PUBLIC_GQL,
																	headers: {
																		"Content-Type": "application/json",
																	},
																	data: {
																		query: lib_gqlSchema.query.usernameValid,
																		variables: {
																			username: usernameInputRef.current.value,
																		},
																	},
																}),
																{
																	loading: "Checking username",
																	success: (response: any) => {
																		const data = response.data.data.usernameValid;

																		setUsernameValid(data.available);

																		if (data.available) {
																			return "Username available";
																		} else {
																			return data.error;
																		}
																	},
																	error: (error) => lib_toaster.multiToast("error", lib_axios.parseError(error)),
																}
															);
															// .then((response) => {
															// 	const data = response.data.data.usernameValid;

															// 	setUsernameValid(data.available);

															// 	if (data.available) {
															// 		toast.success("Username available", {
															// 			id: toastId,
															// 		});
															// 	} else {
															// 		toast.error(data.error, {
															// 			id: toastId,
															// 		});
															// 	}
															// })
															// .catch((error) => {
															// 	toast.error(lib_axios.parseError(error), {
															// 		id: toastId,
															// 	});
															// });
														}
													}, 700);
												}}
												ref={usernameInputRef}
											/>

											<Unicons.UilUser className={`${formStyles["input-icon"]} ${formStyles["left-input-icon"]}`} />
										</div>

										<div
											className={formStyles["input-field"]}
											style={{
												boxShadow: `${passwordValid === null ? "none" : passwordValid ? "0px 0px 3px #00C853" : "0px 0px 3px #EF5350"}`,
											}}
										>
											<input
												className={`${formStyles.input} ${formStyles["password-input"]}`}
												type="password"
												autoComplete="new-password"
												placeholder="New password"
												required
												onChange={(event) => {
													if (!passwordHidden) togglePassword();

													const password = event.target.value;

													saveInput("password", password);

													if (password.replace(/\s/g, "").length === 0) {
														toast.error("Password cannot be empty");

														setPasswordErrors(lib_password.validate(password).errors);
														setPasswordValid(false);

														return;
													}

													const result = lib_password.validate(password);

													if (!result.valid) {
														setPasswordErrors(result.errors);
														setPasswordValid(false);

														return;
													}

													setPasswordErrors([]);
													setPasswordValid(true);
												}}
												ref={passwordInputRef}
											/>
											<Unicons.UilAsterisk className={`${formStyles["input-icon"]} ${formStyles["left-input-icon"]}`} />
											<Unicons.UilEyeSlash
												className={`${formStyles["input-icon"]} ${formStyles["right-input-icon"]}`}
												style={{
													display: passwordHidden ? "block" : "none",
												}}
												onClick={togglePassword}
											/>
											<Unicons.UilEye
												className={`${formStyles["input-icon"]} ${formStyles["right-input-icon"]}`}
												style={{
													display: passwordHidden ? "none" : "block",
												}}
												onClick={togglePassword}
											/>
										</div>

										{passwordErrors && passwordErrors.length > 0 && (
											<ul className={formStyles["error-list"]}>
												{passwordErrors.map((err: any, key: any) => {
													return (
														<li key={`abc_${key}`}>
															<span>{err}</span>
															<br />
														</li>
													);
												})}
											</ul>
										)}

										<input
											className={formStyles["submit-button"]}
											type="submit"
											value={submitButtonValue}
											disabled={submitButtonDisabled}
										/>

										{/* <motion.div
											className={formStyles["bottom-text"]}
											key={`2_back`}
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
											<span>
												<button className={formStyles.link} type="button" onClick={goBack}>
													{"<"} Go back
												</button>
											</span>
										</motion.div> */}

										{/* <motion.div
											className={formStyles["bottom-text"]}
											key={`2_login`}
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
											<span>
												Already have an account?{" "}
												<button
													className={formStyles.link}
													type="button"
													onClick={() => {
														setFormVisible(false);

														setTimeout(() => {
															router.push("/");
														}, 150);
													}}
												>
													Login
												</button>
											</span>
										</motion.div> */}

										<div className={formStyles["bottom-text"]}>
											<button className={formStyles.link} type="button" onClick={goBack}>
												{"<"} Go back
											</button>
										</div>

										<div className={formStyles["bottom-text"]}>
											Already have an account?{" "}
											<button
												className={formStyles.link}
												type="button"
												onClick={() => {
													setFormVisible(false);

													setTimeout(() => {
														router.push("/");
													}, 150);
												}}
											>
												Login
											</button>
										</div>
									</motion.div>
								)}

								{page === 3 && page3Visible && (
									<motion.div
										className={formStyles.page}
										key={page}
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
										<div
											className={formStyles["input-field"]}
											style={{
												boxShadow: `${
													licenseIdValid === null ? "none" : licenseIdValid ? "0px 0px 3px #00C853" : "0px 0px 3px #EF5350"
												}`,
											}}
										>
											<input
												className={formStyles.input}
												type="text"
												autoComplete="off"
												placeholder="License ID"
												required
												onChange={(event) => {
													const licenseId = event.target.value;

													saveInput("licenseId", licenseId);

													if (licenseId.replace(/\s/g, "").length === 0) {
														toast.error("License ID cannot be empty");

														setLicenseIdValid(false);

														return;
													}

													setLicenseIdValid(true);
												}}
												ref={licenseIdInputRef}
											/>
											<Unicons.UilKeySkeleton className={`${formStyles["input-icon"]} ${formStyles["left-input-icon"]}`} />
										</div>

										<div
											className={formStyles["input-field"]}
											style={{
												boxShadow: `${
													licenseKeyValid === null ? "none" : licenseKeyValid ? "0px 0px 3px #00C853" : "0px 0px 3px #EF5350"
												}`,
											}}
										>
											<input
												className={formStyles.input}
												type="text"
												autoComplete="off"
												placeholder="License key"
												required
												onChange={(event) => {
													const licenseKey = event.target.value;

													saveInput("licenseKey", licenseKey);

													if (licenseKey.replace(/\s/g, "").length === 0) {
														toast.error("License key cannot be empty");

														setLicenseKeyValid(false);

														return;
													}

													setLicenseKeyValid(true);
												}}
												ref={licenseKeyInputRef}
											/>
											<Unicons.UilPadlock className={`${formStyles["input-icon"]} ${formStyles["left-input-icon"]}`} />
										</div>

										<Captcha
											provider={captchaSettings.register.provider}
											invisible={captchaSettings.register.invisible}
											onVerify={async (token: any) => {
												setCaptchaModalOpen(false);

												if (
													(captchaSettings.register.provider === "cloudflare" && !captchaSettings.register.invisible.cloudflare) ||
													(captchaSettings.register.provider === "hcaptcha" && !captchaSettings.register.invisible.hcaptcha)
												) {
													setCaptchaToken(token);

													return;
												}

												await register(token);
											}}
											onClose={() => {
												// Onclose only for hcaptcha
												setSubmitButtonValue("Register");
												setSubmitButtonDisabled(false);
											}}
											action={captchaSettings.register.action}
											modalOpen={captchaModalOpen}
											setModalOpen={setCaptchaModalOpen}
											reference={captchaRef}
										/>

										<input
											className={formStyles["submit-button"]}
											type="submit"
											value={submitButtonValue}
											disabled={submitButtonDisabled}
										/>

										{/* <motion.div
											className={formStyles["bottom-text"]}
											key={`3_back`}
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
											<span>
												<button className={formStyles.link} type="button" onClick={goBack}>
													{"<"} Go back
												</button>
											</span>
										</motion.div>

										<motion.div
											className={formStyles["bottom-text"]}
											key={`3_login`}
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
											<span>
												Already have an account?{" "}
												<button
													className={formStyles.link}
													type="button"
													onClick={() => {
														setFormVisible(false);

														setTimeout(() => {
															router.push("/");
														}, 150);
													}}
												>
													Login
												</button>
											</span>
										</motion.div> */}

										<div className={formStyles["bottom-text"]}>
											<button className={formStyles.link} type="button" onClick={goBack}>
												{"<"} Go back
											</button>
										</div>

										<div className={formStyles["bottom-text"]}>
											Already have an account?{" "}
											<button
												className={formStyles.link}
												type="button"
												onClick={() => {
													setFormVisible(false);

													setTimeout(() => {
														router.push("/");
													}, 150);
												}}
											>
												Login
											</button>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
							{/* </div> */}

							<br />
						</form>
						{/* </div> */}
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
