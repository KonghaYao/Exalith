import { NextRequest } from "next/server";
import { join } from "path";
import { createReadStream, promises as fs } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";

// 设置基础路径，用于映射本地磁盘路径
const baseURL = process.env.OSS_BASE_PATH || "/tmp/oss-storage";

// get 请求是获取二进制内容
// post 请求是获取文件的基本信息
// put 是修改文件内容
// delete 是删除文件
// patch 是修改文件的元数据

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } },
) {
  params = await params;
  try {
    const slugPath = params.slug ? params.slug.join("/") : "";
    const filePath = join(baseURL, slugPath);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      const files = await fs.readdir(filePath);
      return new Response(JSON.stringify(files));
    } else {
      const searchParams = request.nextUrl.searchParams;
      const isPreview = searchParams.get("preview") === "true";

      // 5MB in bytes
      const MAX_PREVIEW_SIZE = 5 * 1024 * 1024;

      if (isPreview && stats.size > MAX_PREVIEW_SIZE) {
        return new Response(
          JSON.stringify({
            error: "文件超过 5 MB, 不进行预览",
            size: stats.size,
            maxPreviewSize: MAX_PREVIEW_SIZE,
          }),
          { status: 200 },
        );
      }
      const fileStream = createReadStream(decodeURIComponent(filePath));
      const fileName = params.slug[params.slug.length - 1];

      const headers = new Headers();
      headers.set("Content-Type", "application/octet-stream");
      headers.set(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(fileName)}"`,
      );
      headers.set("Content-Length", stats.size.toString());

      return new Response(Readable.toWeb(fileStream) as any as ReadableStream, {
        headers,
      });
    }
  } catch (error) {
    console.error("Error reading file:", error);
    if (!params.slug) {
      try {
        const files = await fs.readdir(baseURL);
        return new Response(JSON.stringify(files));
      } catch (e) {
        return new Response("Storage directory not accessible", {
          status: 500,
        });
      }
    }
    return new Response("File or directory not found", { status: 404 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string[] } },
) {
  params = await params;
  try {
    const slugPath = params.slug ? params.slug.join("/") : "";
    const filePath = join(baseURL, slugPath);
    const stats = await stat(filePath);
    const isDir = stats.isDirectory();

    const baseInfo = {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isDirectory: isDir,
    };

    if (isDir) {
      const files = await fs.readdir(filePath);
      const contents = await Promise.all(
        files.map(async (file) => {
          const fullPath = join(filePath, file);
          const fileStats = await stat(fullPath);
          return {
            name: file,
            size: fileStats.size,
            created: fileStats.birthtime,
            modified: fileStats.mtime,
            isDirectory: fileStats.isDirectory(),
          };
        }),
      );
      return new Response(
        JSON.stringify({
          ...baseInfo,
          contents,
        }),
      );
    }

    return new Response(JSON.stringify(baseInfo));
  } catch (error) {
    try {
      const stats = await stat(baseURL);
      const files = await fs.readdir(baseURL);
      const contents = await Promise.all(
        files.map(async (file) => {
          const fullPath = join(baseURL, file);
          const fileStats = await stat(fullPath);
          return {
            name: file,
            size: fileStats.size,
            created: fileStats.birthtime,
            modified: fileStats.mtime,
            isDirectory: fileStats.isDirectory(),
          };
        }),
      );
      return new Response(
        JSON.stringify({
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          isDirectory: true,
          contents,
        }),
      );
    } catch (e) {
      return new Response("Storage directory not accessible", {
        status: 500,
      });
    }
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string[] } },
) {
  params = await params;
  if (!params.slug || params.slug.length === 0) {
    return new Response("Cannot write to root directory", { status: 400 });
  }

  try {
    const slugPath = params.slug.join("/");
    const filePath = join(baseURL, slugPath);
    const contentType = request.headers.get("Content-Type");

    // 如果Content-Type是directory，则创建文件夹
    if (contentType === "application/x-directory") {
      await fs.mkdir(filePath, { recursive: true });
      return new Response("Directory created successfully", { status: 200 });
    }

    // 否则按照原来的逻辑处理文件上传
    const content = await request.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(content));

    return new Response("File updated successfully", { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(`Failed to process request: ${errorMessage}`, {
      status: 500,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string[] } },
) {
  params = await params;
  if (!params.slug || params.slug.length === 0) {
    return new Response("Cannot delete root directory", { status: 400 });
  }

  try {
    const slugPath = params.slug.join("/");
    const filePath = join(baseURL, slugPath);

    const stats = await stat(filePath);
    if (stats.isDirectory()) {
      await fs.rm(filePath, { recursive: true });
      return new Response("Directory deleted successfully", { status: 200 });
    } else {
      await fs.unlink(filePath);
      return new Response("File deleted successfully", { status: 200 });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(`Failed to delete: ${errorMessage}`, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string[] } },
) {
  params = await params;
  if (!params.slug || params.slug.length === 0) {
    return new Response("Cannot modify root directory metadata", {
      status: 400,
    });
  }

  try {
    const slugPath = params.slug.join("/");
    const filePath = join(baseURL, slugPath);

    const metadata = await request.json();
    const stats = await stat(filePath);

    if (metadata.mtime) {
      await fs.utimes(filePath, stats.atime, new Date(metadata.mtime));
    }

    return new Response("Metadata updated successfully", { status: 200 });
  } catch (error) {
    return new Response("Failed to update metadata", { status: 500 });
  }
}
