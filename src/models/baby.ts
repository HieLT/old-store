import { boolean } from "joi";
import { model, Schema } from "mongoose";

export interface IBaby {
  _id: Schema.Types.ObjectId;
  firstname: string;
  lastname: string;
  birthdate: Date;
  parent_id: Schema.Types.ObjectId;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  is_deleted: boolean
};

const Baby = new Schema<IBaby>({
  firstname: {
    type: String,
    required: [true, 'fisrtname là bắt buộc']
  },
  lastname: {
    type: String,
    required: [true, 'lastname là bắt buộc']
  },
  birthdate: {
    type: Date,
    required: [true, 'ngày sinh là bắt buộc']
  },
  parent_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Cần đăng nhập'],
    immutable: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Cần thêm giới tính']
  },
  weight: {
    type: Number,
    default: null,
    validate: {
      validator: function (weight: number) {
        if (weight === null) return true;
        return weight >= 2.5 && weight <= 25
      },
      message: 'Cân nặng của bé phải trong khoảng 2.5 - 25kg'
    }
  },
  height: {
    type: Number,
    default: null,
    validate: {
      validator: function (height: number) {
        if (height == null) return true;
        return height >= 46 && height <= 100
      },
      message: 'Chiều cao của bé phải trong khoảng 46 - 100cm'
    }
  },
  is_deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default model<IBaby>('Baby', Baby);
