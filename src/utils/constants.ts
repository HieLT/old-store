export const validatorMessages = {
    'string.base': '{{#label}} phải là một chuỗi',
    'string.empty': '{{#label}} không đuợc bỏ trống',
    'string.length': '{{#label}} không được vượt quá {{#limit}} kí tự',
    'string.lowercase': '{{#label}} chỉ được chứa kí tự viết thường',
    'string.trim': '{{#label}} không được chứa khoảng trống',
    'string.uppercase': '{{#label}} chỉ được chứa kí tự viết hoa',

    'any.only': '{{#label}} phải là 1 trong các giá trị {#valids}',
    'any.required': '{{#label}} không được bỏ trống',
    "any.unknown": "Trường {#label} không được xác định",

    'array.base': "{{#label}} phải là 1 mảng",
    'array.includes': "{{#label}} không chứa đúng các phần tử yêu cầu",
    'array.min': "{{#label}} phải chứa ít nhất {#limit} giá trị",
    'object.unknown': "Trường {{#label}} không được xác định"
}

export const DEFAULT_GET_QUERY = {
    PAGE: 1,
    PAGE_SIZE: 20,
    COLUMN: 'createdAt',
    SORT_ORDER: -1
}
