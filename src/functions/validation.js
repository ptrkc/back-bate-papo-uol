import Joi from "joi";

export function trimAndClean(string) {
    return string.replace(/<|>/g, "").trim();
}

export function checkUserError(request) {
    const schema = Joi.object({
        user: Joi.string().replace(/<|>/g, "").required().trim(),
    }).unknown(true);
    const error = schema.validate(request).error;
    return error ? true : false;
}

export function checkNameError(request) {
    const schema = Joi.object({
        name: Joi.string().replace(/<|>/g, "").required().trim(),
    }).unknown(true);
    const error = schema.validate(request).error;
    return error ? true : false;
}

export function checkNewMsgError(request) {
    const schema = Joi.object({
        to: Joi.string().replace(/<|>/g, "").required().trim(),
        text: Joi.string().replace(/<|>/g, "").required().trim(),
        type: Joi.string()
            .pattern(new RegExp(/(^message$|^private_message$)/))
            .required(),
    });
    const error = schema.validate(request).error;
    return error ? true : false;
}
