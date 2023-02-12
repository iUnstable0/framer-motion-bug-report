// THIS IS THE CHANGE PROFILE PIC FORM

import { useState, useEffect, useRef, useCallback } from "react";

import Head from "next/head";
import Image from "next/image";

import { useRouter } from "next/router";

// Additional Packages

import toast from "react-hot-toast";
import axios from "axios";

import { motion, AnimatePresence } from "framer-motion";
import { setCookie, getCookie } from "cookies-next";
import { BiCode } from "react-icons/bi";
import { useDropzone } from "react-dropzone";

// import * as lib from "modules";
import lib_axios from "modules/axios";
import lib_toaster from "modules/toaster";
import lib_gqlSchema from "modules/gqlSchema";

// @ts-ignore
import * as Unicons from "@iconscout/react-unicons";

// Components

import Cropper from "react-easy-crop";

import Captcha from "components/captcha";
import Toaster from "components/toaster";
import Blur from "components/blur";

// Styles

import sidebarNavStyles from "./styles/SidebarNav.module.scss";

import formStyles from "styles/Form.module.scss";

const captchaSettings = {
	changeProfilePicture: {
		provider: "cloudflare",
		invisible: {
			cloudflare: true,
			hcaptcha: true,
		},
		action: "ChangeProfilePicture",
	},
};

export default function Component({
	user,
	page,
	setPage,
	blurModals = [],
	setBlurModals = [],
}: {
	user: {
		account: any;
		discord: any;
	};
	page: any;
	setPage: any;
	blurModals?: Array<any>;
	setBlurModals?: Array<any>;
}) {
	const router = useRouter();

	// const [selectedPage, setSelectedPage] = useState<any>(router.pathname),
	const [changeProfileVisible, setChangeProfileVisible] = useState<any>(false),
		[blurVisible, setBlurVisible] = useState<any>(false);

	const [captchaModalOpen, setCaptchaModalOpen] = useState<any>(false);

	const [captchaToken, setCaptchaToken] = useState<any>(""),
		[acceptedFiles, setAcceptedFiles] = useState<any>([]),
		[changeProfilePage, setChangeProfilePage] = useState<any>(1),
		[changeProfilePage1Visible, setChangeProfilePage1Visible] = useState<any>(true),
		[changeProfilePage2Visible, setChangeProfilePage2Visible] = useState<any>(false),
		[crop, setCrop] = useState({ x: 0, y: 0 }),
		[zoom, setZoom] = useState(1);

	const [submitButtonValue, setSubmitButtonValue] = useState<any>("Confirm"),
		[submitButtonDisabled, setSubmitButtonDisabled] = useState<any>(true);

	const captchaRef = useRef<any>(null);

	const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
		// console.log(croppedArea, croppedAreaPixels);
	}, []);

	const uploadFileRef = useRef<any>(null);

	const changeChangeProfilePage = async (page: number) => {
			if (page === 1) {
				setChangeProfilePage1Visible(true);
				setChangeProfilePage2Visible(false);
			} else if (page === 2) {
				setChangeProfilePage1Visible(false);
				setChangeProfilePage2Visible(true);
			}

			// return;

			setTimeout(() => {
				setChangeProfilePage(page);

				// setSubmitButtonDisabled(true);

				if (page === 1) {
					// setSubmitButtonValue("Next");
					// const interval = setInterval(() => {
					// 	if (emailInputRef.current) {
					// 		clearInterval(interval);
					// 		emailInputRef.current.focus();
					// 		if (inputData.email) emailInputRef.current.value = inputData.email;
					// 	}
					// }, 1);
				} else if (page === 2) {
					// setPage2Init(false);
					// setPage2Visible(true);
					// setSubmitButtonValue("Next");
					// const interval = setInterval(() => {
					// 	if (usernameInputRef.current && passwordInputRef.current) {
					// 		clearInterval(interval);
					// 		usernameInputRef.current.focus();
					// 		if (inputData.username) usernameInputRef.current.value = inputData.username;
					// 		if (inputData.password) passwordInputRef.current.value = inputData.password;
					// 	}
					// }, 1);
				}
			}, 300);
		},
		advanceChangeProfilePage = () => {
			if (changeProfilePage < 2) {
				changeChangeProfilePage(changeProfilePage + 1);
			}
		},
		goBackChangeProfile = () => {
			if (changeProfilePage > 1) {
				changeChangeProfilePage(changeProfilePage - 1);
			}
		},
		uploadProfilePicture = async (url: string) => {
			const imageBlobURL = URL.createObjectURL(acceptedFiles[0]);

			fetch(imageBlobURL)
				.then((response) => response.blob())
				.then((imageBlob) => {
					const reader: any = new FileReader();

					reader.readAsArrayBuffer(imageBlob);
					reader.onloadend = function () {
						const buffer = Buffer.from(reader.result);

						toast.promise(
							lib_axios.request({
								method: "PUT",
								url: url,
								data: buffer,
								headers: {
									"Content-Type": acceptedFiles[0].type,
								},
							}),
							{
								loading: "Uploading",
								success: (response: any) => {
									const data = response.data;

									console.log(data);

									return "Uploaded";
								},
								error: (error: any) => {
									return lib_toaster.multiToast("error", lib_axios.parseError(error));
								},
							}
						);
					};
				});
		},
		requestUploadProfilePicture = async (token: string) => {
			const toastId = toast.loading("Preparing to upload");

			lib_axios
				.request({
					method: "POST",
					url: "/gql",
					baseURL: process.env.NEXT_PUBLIC_GQL,
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${getCookie("token")}`,
					},
					data: {
						query: lib_gqlSchema.mutation.requestChangeProfilePicture,
						variables: {
							captchaToken: token,
							provider: captchaSettings.changeProfilePicture.provider,
							file: {
								name: acceptedFiles[0].name,
								size: acceptedFiles[0].size,
								mime: acceptedFiles[0].type,
							},
						},
					},
				})
				.then((response: any) => {
					const data = response.data.data.requestChangeProfilePicture;

					toast.dismiss(toastId);

					uploadProfilePicture(data[0].url);
				})
				.catch((error) => {
					toast.error(lib_toaster.multiToast("error", lib_axios.parseError(error)), {
						id: toastId,
					});
				});

			// toast.promise(
			// 	lib_axios.request({
			// 		method: "POST",
			// 		url: "/gql",
			// 		baseURL: process.env.NEXT_PUBLIC_GQL,
			// 		headers: {
			// 			"Content-Type": "application/json",
			// 			Authorization: `Bearer ${getCookie("token")}`,
			// 		},
			// 		data: {
			// 			query: lib_gqlSchema.mutation.requestChangeProfilePicture,
			// 			variables: {
			// 				captchaToken: token,
			// 				provider: captchaSettings.changeProfilePicture.provider,
			// 				file: {
			// 					name: acceptedFiles[0].name,
			// 					size: acceptedFiles[0].size,
			// 					mime: acceptedFiles[0].type,
			// 				},
			// 			},
			// 		},
			// 	}),
			// 	{
			// 		loading: "Requesting upload",
			// 		success: (response: any) => {
			// 			const data = response.data.data.requestChangeProfilePicture;
			// 		},
			// 		error: (error) => {
			// 			return lib_toaster.multiToast("error", lib_axios.parseError(error));
			// 		},
			// 	}
			// );
		};

	let lowerPageName = router.pathname.split("/")[2];

	if (!lowerPageName) {
		lowerPageName = "home";
	}

	const pageName = lowerPageName.substring(0, 1).toUpperCase() + lowerPageName.substring(1);

	const title = `${pageName} - Falcon Serverside`;

	// useEffect(() => {
	// 	if (page) setSelectedPage(forceSelectedPage);
	// }, [forceSelectedPage]);

	useEffect(() => {
		if (changeProfileVisible) {
			setBlurVisible(true);
		} else if (blurModals.length > 0) {
			let blurVisible = false;

			for (const modal of blurModals) {
				if (modal) {
					blurVisible = true;
				}
			}

			setBlurVisible(blurVisible);
		} else {
			setBlurVisible(false);
		}
	}, [changeProfileVisible, blurModals]);

	const onDrop = useCallback((acceptedFiles: any) => {
		setAcceptedFiles(acceptedFiles);
		advanceChangeProfilePage();

		// console.log(acceptedFiles);
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/*": [".png", ".jpg", ".jpeg"],
		},
	});

	return (
		<>
			<Head>
				<title>{title}</title>
			</Head>

			<Toaster />

			<Blur modals={[setChangeProfileVisible, ...setBlurModals]} visible={blurVisible} />

			<AnimatePresence>
				{changeProfileVisible && (
					<motion.div
						className={formStyles.container}
						style={{
							minHeight: changeProfilePage1Visible ? "250px" : "400px",
							maxHeight: changeProfilePage1Visible ? "250px" : "400px",
						}}
						key={`changeProfile`}
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
							duration: 0.1,
						}}
					>
						<h1 className={formStyles.title}>Change profile picture</h1>

						<AnimatePresence>
							{changeProfilePage === 1 && changeProfilePage1Visible && (
								<motion.div
									className={sidebarNavStyles["change-profile-options"]}
									key={`cpf_${changeProfilePage}`}
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
										duration: 0.25,
									}}
								>
									{/* {!user.account.profilePicture.includes("dicebear") && ( */}
									<div className={sidebarNavStyles["change-profile-option"]} {...getRootProps()}>
										<Unicons.UilUpload
											className={sidebarNavStyles["change-profile-option-icon"]}
											style={{
												width: "40px",
												height: "40px",
												marginBottom: "10px",
											}}
										/>
										{isDragActive ? (
											"Drop file here"
										) : (
											<>
												Drag and drop file here
												<br />
												or click to select file
											</>
										)}
										<input className={sidebarNavStyles["file-input"]} type="file" ref={uploadFileRef} {...getInputProps()} />
									</div>
									{/* )} */}

									{/* <button
								className={sidebarNavStyles["change-profile-option"]}
								type="button"
								onClick={() => {
									setChangeProfilePage(2);
								}}
							>
								<Unicons.UilApps
									className={sidebarNavStyles["change-profile-option-icon"]}
									style={{
										width: "40px",
										height: "40px",
										marginBottom: "10px",
									}}
								/>
								Generate with Dicebear
							</button> */}

									{/* Create a drop file here or click to upload form */}
									{/* <form className={sidebarNavStyles["change-profile-option"]}>
								<div className={sidebarNavStyles["drop-area"]}>
									{isDragActive ? <p>Drop the files here ...</p> : <p>Drag and drop some files here, or click to select files</p>}
								</div>
								<input className={sidebarNavStyles["file-input"]} type="file" ref={uploadFileRef} {...getInputProps()} />
							</form> */}
								</motion.div>
							)}

							{changeProfilePage === 2 && changeProfilePage2Visible && (
								<motion.div
									className={sidebarNavStyles["change-profile-preview-container"]}
									key={`cpf_${changeProfilePage}`}
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
										duration: 0.25,
									}}
								>
									{/* Display the image */}
									<div className={sidebarNavStyles["change-profile-preview"]}>
										{/* <Image
											src={URL.createObjectURL(acceptedFiles[0])}
											style={{
												objectFit: "cover",
											}}
											className={sidebarNavStyles["change-profile-image"]}
											alt="Profile Picture"
											fill
											priority={true}
										/> */}
										<Cropper
											image={URL.createObjectURL(acceptedFiles[0])}
											crop={crop}
											zoom={zoom}
											cropShape="round"
											aspect={1 / 1}
											onCropChange={setCrop}
											onCropComplete={onCropComplete}
											onZoomChange={setZoom}
										/>
									</div>

									<Captcha
										provider={captchaSettings.changeProfilePicture.provider}
										invisible={captchaSettings.changeProfilePicture.invisible}
										onVerify={async (token: any) => {
											setCaptchaModalOpen(false);

											if (
												(captchaSettings.changeProfilePicture.provider === "cloudflare" &&
													!captchaSettings.changeProfilePicture.invisible.cloudflare) ||
												(captchaSettings.changeProfilePicture.provider === "hcaptcha" &&
													!captchaSettings.changeProfilePicture.invisible.hcaptcha)
											) {
												setCaptchaToken(token);

												return;
											}

											await requestUploadProfilePicture(token);
										}}
										onClose={() => {
											// Onclose only for hcaptcha
											setSubmitButtonValue("Change");
											setSubmitButtonDisabled(false);
										}}
										action={captchaSettings.changeProfilePicture.action}
										modalOpen={captchaModalOpen}
										setModalOpen={setCaptchaModalOpen}
										reference={captchaRef}
									/>

									<button
										className={formStyles["submit-button"]}
										type="button"
										onClick={async () => {
											setSubmitButtonDisabled(true);
											setSubmitButtonValue("Please wait...");

											if (
												captchaSettings.changeProfilePicture.provider === "hcaptcha" &&
												captchaSettings.changeProfilePicture.invisible.hcaptcha
											) {
												captchaRef.current.execute();

												return;
											}

											if (
												captchaSettings.changeProfilePicture.provider === "cloudflare" &&
												captchaSettings.changeProfilePicture.invisible.cloudflare
											) {
												setCaptchaModalOpen(true);

												return;
											}

											// setCaptchaModalOpen(true);

											await requestUploadProfilePicture(captchaToken);
										}}
									>
										Confirm
									</button>

									<motion.div
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
											duration: 0.25,
										}}
									>
										<span>
											<button
												className={formStyles.link}
												type="button"
												onClick={() => {
													setAcceptedFiles([]);
													goBackChangeProfile();
												}}
											>
												{"<"} Go back
											</button>
										</span>
									</motion.div>
									<br />
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				)}
			</AnimatePresence>

			<div className={sidebarNavStyles.container}>
				<div className={sidebarNavStyles.header}>
					<div className={sidebarNavStyles.profile}>
						<Image
							src={user.account.profilePicture}
							alt="Profile Picture"
							className={sidebarNavStyles["profile-image"]}
							width={40}
							height={40}
							priority={true}
						/>

						<div
							className={sidebarNavStyles["profile-edit-layer"]}
							onClick={() => {
								setChangeProfileVisible(true);
							}}
						>
							<Unicons.UilPen className={sidebarNavStyles["profile-edit-icon"]} />
						</div>
					</div>

					<div className={sidebarNavStyles.user}>
						<span className={sidebarNavStyles.username}>{user.account.username}</span>
						<span className={sidebarNavStyles["product-name"]}>Falcon Serverside</span>
					</div>
				</div>

				<div className={sidebarNavStyles.content}>
					<div className={sidebarNavStyles.menu}>
						<div className={sidebarNavStyles["category"]}></div>
						<button
							className={`${sidebarNavStyles["menu-link"]} ${page === "dashboard" ? sidebarNavStyles["menu-link-active"] : ""}`}
							onClick={() => {
								// if (page !== "dashboard") {
								setPage("dashboard");

								// router.push("/dashboard");
								// }
							}}
						>
							<Unicons.UilEstate className={sidebarNavStyles.icon} />
							<span className={sidebarNavStyles["menu-name"]}>Home</span>
						</button>
						<button
							className={`${sidebarNavStyles["menu-link"]} ${page === "executor" ? sidebarNavStyles["menu-link-active"] : ""}`}
							onClick={() => {
								// if (page !== "executor") {
								setPage("executor");

								// router.push("/dashboard/executor");
								// }
							}}
						>
							<BiCode className={`${sidebarNavStyles.icon} ${sidebarNavStyles["special-icon"]}`} />
							<span className={sidebarNavStyles["menu-name"]}>Executor</span>
						</button>
						<button
							className={`${sidebarNavStyles["menu-link"]} ${page === "games" ? sidebarNavStyles["menu-link-active"] : ""}`}
							onClick={() => {
								// if (page !== "games") {
								setPage("games");

								// router.push("/dashboard/games");
								// }
							}}
						>
							<Unicons.UilServerConnection className={sidebarNavStyles.icon} />
							<span className={sidebarNavStyles["menu-name"]}>Games</span>
						</button>
						<div className={sidebarNavStyles["category"]}></div>
						<button
							className={`${sidebarNavStyles["menu-link"]} ${page === "account" ? sidebarNavStyles["menu-link-active"] : ""}`}
							onClick={() => {
								// if (page !== "account") {
								setPage("account");

								// router.push("/dashboard/account");
								// }
							}}
						>
							<Unicons.UilUser className={sidebarNavStyles.icon} />
							<span className={sidebarNavStyles["menu-name"]}>Account</span>
						</button>
						<button
							className={`${sidebarNavStyles["menu-link"]} ${page === "security" ? sidebarNavStyles["menu-link-active"] : ""}`}
							onClick={() => {
								// if (page !== "security") {
								setPage("security");

								// router.push("/dashboard/security");
								// }
							}}
						>
							<Unicons.UilLockAccess className={sidebarNavStyles.icon} />
							<span className={sidebarNavStyles["menu-name"]}>Security</span>
						</button>
						<button
							className={`${sidebarNavStyles["menu-link"]} ${page === "settings" ? sidebarNavStyles["menu-link-active"] : ""}`}
							onClick={() => {
								// if (page !== "settings") {
								setPage("settings");

								// router.push("/dashboard/settings");
								// }
							}}
						>
							<Unicons.UilCog className={sidebarNavStyles.icon} />
							<span className={sidebarNavStyles["menu-name"]}>Settings</span>
						</button>
						<div className={sidebarNavStyles["category"]}></div>
						<button
							className={`${sidebarNavStyles["menu-link"]} ${page === "faq" ? sidebarNavStyles["menu-link-active"] : ""}`}
							onClick={() => {
								// if (page !== "faq") {
								setPage("faq");
								// router.push("/dashboard/faq");
								// }
							}}
						>
							<Unicons.UilCommentQuestion className={sidebarNavStyles.icon} />
							<span className={sidebarNavStyles["menu-name"]}>FAQ</span>
						</button>
					</div>
					<div className={sidebarNavStyles["bottom-content"]}>
						<button
							className={`${sidebarNavStyles["menu-link"]}`}
							onClick={() => {
								toast.promise(
									lib_axios.request({
										method: "POST",
										url: "/gql",
										baseURL: process.env.NEXT_PUBLIC_GQL,
										headers: {
											"Content-Type": "application/json",
											Authorization: `Bearer ${getCookie("token")}`,
										},
										data: {
											query: lib_gqlSchema.mutation.logout,
										},
									}),
									{
										loading: "Logging out",
										success: (response: any) => {
											const data = response.data.data.logout;

											router.push("/");

											return "Logged out";
										},
										error: (error) => lib_toaster.multiToast("error", lib_axios.parseError(error)),
									}
								);
							}}
						>
							<Unicons.UilSignout className={sidebarNavStyles.icon} />
							<span className={sidebarNavStyles["menu-name"]}>Logout</span>
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
